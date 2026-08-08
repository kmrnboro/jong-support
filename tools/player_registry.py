"""Validation and updates for the private cross-year player registry."""

from __future__ import annotations

import json
import re
import secrets
import tempfile
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import TypedDict

REGISTRY_VERSION = "1.0.0"
PLAYER_ID_PATTERN = re.compile(r"^player_[0-9a-f]{32}$")
MAX_NICKNAME_LENGTH = 100


class RegistryPlayer(TypedDict):
    playerId: str
    currentNickname: str
    previousNicknames: list[str]


class PlayerRegistry(TypedDict):
    schemaVersion: str
    players: list[RegistryPlayer]


class PlayerRegistryError(Exception):
    """Raised when a registry operation cannot be completed safely."""


def empty_registry() -> PlayerRegistry:
    return {"schemaVersion": REGISTRY_VERSION, "players": []}


def _validate_nickname(value: object, field_name: str) -> str:
    if not isinstance(value, str) or not value:
        raise PlayerRegistryError(f"{field_name} must be a non-empty string")
    if value != value.strip():
        raise PlayerRegistryError(f"{field_name} must not have surrounding whitespace")
    if len(value) > MAX_NICKNAME_LENGTH:
        raise PlayerRegistryError(
            f"{field_name} must be at most {MAX_NICKNAME_LENGTH} characters"
        )
    return value


def validate_registry(value: object) -> PlayerRegistry:
    if not isinstance(value, dict):
        raise PlayerRegistryError("Registry must be a JSON object")
    if set(value) != {"schemaVersion", "players"}:
        raise PlayerRegistryError("Registry contains missing or unknown fields")
    if value.get("schemaVersion") != REGISTRY_VERSION:
        raise PlayerRegistryError("Unsupported player registry schemaVersion")

    raw_players = value.get("players")
    if not isinstance(raw_players, list):
        raise PlayerRegistryError("players must be an array")

    players: list[RegistryPlayer] = []
    seen_ids: set[str] = set()

    for index, raw_player in enumerate(raw_players):
        field = f"players[{index}]"
        if not isinstance(raw_player, dict):
            raise PlayerRegistryError(f"{field} must be an object")
        if set(raw_player) != {
            "playerId",
            "currentNickname",
            "previousNicknames",
        }:
            raise PlayerRegistryError(f"{field} contains missing or unknown fields")

        player_id = raw_player.get("playerId")
        if not isinstance(player_id, str) or not PLAYER_ID_PATTERN.fullmatch(player_id):
            raise PlayerRegistryError(f"{field}.playerId has an invalid format")
        if player_id in seen_ids:
            raise PlayerRegistryError(f"Duplicate playerId: {player_id}")

        current_nickname = _validate_nickname(
            raw_player.get("currentNickname"),
            f"{field}.currentNickname",
        )
        raw_previous = raw_player.get("previousNicknames")
        if not isinstance(raw_previous, list):
            raise PlayerRegistryError(f"{field}.previousNicknames must be an array")

        previous_nicknames = [
            _validate_nickname(nickname, f"{field}.previousNicknames[{item_index}]")
            for item_index, nickname in enumerate(raw_previous)
        ]
        normalized_previous = [nickname.casefold() for nickname in previous_nicknames]
        if len(set(normalized_previous)) != len(normalized_previous):
            raise PlayerRegistryError(f"{field}.previousNicknames contains duplicates")
        if current_nickname.casefold() in normalized_previous:
            raise PlayerRegistryError(
                f"{field}.currentNickname must not appear in previousNicknames"
            )

        seen_ids.add(player_id)
        players.append(
            {
                "playerId": player_id,
                "currentNickname": current_nickname,
                "previousNicknames": previous_nicknames,
            }
        )

    return {"schemaVersion": REGISTRY_VERSION, "players": players}


def load_registry(path: Path) -> PlayerRegistry:
    try:
        value: object = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise PlayerRegistryError(f"Registry does not exist: {path}") from error
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise PlayerRegistryError(f"Could not read registry: {path}") from error
    return validate_registry(value)


def save_registry(path: Path, registry: Mapping[str, object]) -> None:
    validated = validate_registry(dict(registry))
    serialized = json.dumps(validated, ensure_ascii=False, indent=2) + "\n"
    temporary_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            newline="\n",
            delete=False,
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
        ) as temporary_file:
            temporary_file.write(serialized)
            temporary_path = Path(temporary_file.name)
        temporary_path.replace(path)
    except OSError as error:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
        raise PlayerRegistryError(f"Could not write registry: {path}") from error


def initialize_registry(path: Path) -> None:
    if path.exists():
        raise PlayerRegistryError(f"Registry already exists: {path}")
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        raise PlayerRegistryError(
            f"Could not create registry directory: {path.parent}"
        ) from error
    save_registry(path, empty_registry())


def _nicknames(player: RegistryPlayer) -> list[str]:
    return [player["currentNickname"], *player["previousNicknames"]]


def find_players(registry: PlayerRegistry, query: str = "") -> list[RegistryPlayer]:
    normalized_query = query.strip().casefold()
    if not normalized_query:
        return list(registry["players"])
    return [
        player
        for player in registry["players"]
        if normalized_query in player["playerId"].casefold()
        or any(normalized_query in nickname.casefold() for nickname in _nicknames(player))
    ]


def _matching_nickname_players(
    registry: PlayerRegistry,
    nickname: str,
    *,
    exclude_player_id: str | None = None,
) -> list[RegistryPlayer]:
    normalized_nickname = nickname.casefold()
    return [
        player
        for player in registry["players"]
        if player["playerId"] != exclude_player_id
        and any(
            normalized_nickname == known_nickname.casefold()
            for known_nickname in _nicknames(player)
        )
    ]


def generate_player_id() -> str:
    return f"player_{secrets.token_hex(16)}"


def add_player(
    registry: PlayerRegistry,
    nickname: str,
    *,
    allow_duplicate_nickname: bool = False,
    id_factory: Callable[[], str] = generate_player_id,
) -> RegistryPlayer:
    validated_nickname = _validate_nickname(nickname, "nickname")
    matches = _matching_nickname_players(registry, validated_nickname)
    if matches and not allow_duplicate_nickname:
        match_ids = ", ".join(player["playerId"] for player in matches)
        raise PlayerRegistryError(
            "Nickname already exists. Select the existing playerId or explicitly "
            f"allow a duplicate nickname: {match_ids}"
        )

    existing_ids = {player["playerId"] for player in registry["players"]}
    player_id = id_factory()
    if not PLAYER_ID_PATTERN.fullmatch(player_id):
        raise PlayerRegistryError("Generated playerId has an invalid format")
    if player_id in existing_ids:
        raise PlayerRegistryError(f"Generated playerId already exists: {player_id}")

    player: RegistryPlayer = {
        "playerId": player_id,
        "currentNickname": validated_nickname,
        "previousNicknames": [],
    }
    registry["players"].append(player)
    return player


def rename_player(
    registry: PlayerRegistry,
    player_id: str,
    new_nickname: str,
    *,
    allow_duplicate_nickname: bool = False,
) -> RegistryPlayer:
    player = next(
        (item for item in registry["players"] if item["playerId"] == player_id),
        None,
    )
    if player is None:
        raise PlayerRegistryError(f"Unknown playerId: {player_id}")

    validated_nickname = _validate_nickname(new_nickname, "nickname")
    if validated_nickname.casefold() == player["currentNickname"].casefold():
        raise PlayerRegistryError("New nickname is the same as the current nickname")

    matches = _matching_nickname_players(
        registry,
        validated_nickname,
        exclude_player_id=player_id,
    )
    if matches and not allow_duplicate_nickname:
        match_ids = ", ".join(item["playerId"] for item in matches)
        raise PlayerRegistryError(
            "Nickname belongs to another registry entry. Confirm the identity or "
            f"explicitly allow a duplicate nickname: {match_ids}"
        )

    previous = [
        nickname
        for nickname in player["previousNicknames"]
        if nickname.casefold() != validated_nickname.casefold()
    ]
    previous.append(player["currentNickname"])
    player["currentNickname"] = validated_nickname
    player["previousNicknames"] = previous
    return player

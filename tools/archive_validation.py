"""JSON Schema and reference validation for Archive 1.0 files."""

from __future__ import annotations

import json
from collections.abc import Mapping
from pathlib import Path
from typing import cast

from jsonschema import Draft202012Validator
from jsonschema.exceptions import SchemaError

if __package__:
    from .player_registry import PlayerRegistry
else:
    from player_registry import PlayerRegistry

REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
ARCHIVE_SCHEMA_PATH = REPOSITORY_ROOT / "schemas/tournament-archive.schema.json"
INDEX_SCHEMA_PATH = REPOSITORY_ROOT / "schemas/archive-index.schema.json"


class ArchiveValidationError(Exception):
    """Raised when an Archive or Archive index is not safe to publish."""


def _load_schema(path: Path) -> Mapping[str, object]:
    try:
        value: object = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ArchiveValidationError(f"Could not read JSON Schema: {path}") from error
    if not isinstance(value, dict):
        raise ArchiveValidationError(f"JSON Schema must be an object: {path}")
    return cast(Mapping[str, object], value)


def _validator(path: Path) -> Draft202012Validator:
    schema = _load_schema(path)
    try:
        Draft202012Validator.check_schema(schema)
    except SchemaError as error:
        raise ArchiveValidationError(f"Invalid JSON Schema: {path}") from error
    return Draft202012Validator(schema)


def _format_error_path(parts: list[object]) -> str:
    if not parts:
        return "$"
    result = "$"
    for part in parts:
        result += f"[{part}]" if isinstance(part, int) else f".{part}"
    return result


def _validate_schema(value: object, path: Path) -> None:
    errors = sorted(_validator(path).iter_errors(value), key=lambda item: list(item.path))
    if not errors:
        return
    first = errors[0]
    location = _format_error_path(list(first.absolute_path))
    raise ArchiveValidationError(f"{location}: {first.message}")


def _as_mapping(value: object, field: str) -> Mapping[str, object]:
    if not isinstance(value, dict):
        raise ArchiveValidationError(f"{field} must be an object")
    return cast(Mapping[str, object], value)


def _as_list(value: object, field: str) -> list[object]:
    if not isinstance(value, list):
        raise ArchiveValidationError(f"{field} must be an array")
    return cast(list[object], value)


def _string(mapping: Mapping[str, object], key: str, field: str) -> str:
    value = mapping.get(key)
    if not isinstance(value, str):
        raise ArchiveValidationError(f"{field}.{key} must be a string")
    return value


def _ensure_unique(values: list[str], field: str) -> None:
    if len(values) != len(set(values)):
        raise ArchiveValidationError(f"{field} contains duplicates")


def _validate_department(
    department: Mapping[str, object],
    *,
    department_name: str,
    players_by_id: Mapping[str, Mapping[str, object]],
    result_groups: list[list[object]],
) -> None:
    referenced_ids: list[str] = []
    for group_index, raw_group in enumerate(result_groups):
        group_player_ids: list[str] = []
        for result_index, raw_result in enumerate(raw_group):
            result = _as_mapping(
                raw_result,
                f"{department_name}.results[{group_index}][{result_index}]",
            )
            player_id = _string(result, "playerId", department_name)
            if player_id not in players_by_id:
                raise ArchiveValidationError(
                    f"{department_name} references unknown playerId: {player_id}"
                )
            group_player_ids.append(player_id)
            referenced_ids.append(player_id)
        _ensure_unique(group_player_ids, f"{department_name} result group")

    official_results = _as_list(
        department.get("officialResults"),
        f"{department_name}.officialResults",
    )
    official_result_ids: list[str] = []
    for raw_result in official_results:
        result = _as_mapping(raw_result, f"{department_name}.officialResults[]")
        player_id = _string(result, "playerId", department_name)
        player = players_by_id.get(player_id)
        if player is None:
            raise ArchiveValidationError(
                f"{department_name}.officialResults references unknown playerId: "
                f"{player_id}"
            )
        eligibility = _as_mapping(
            player.get("rankingEligibility"),
            f"players[{player_id}].rankingEligibility",
        ).get(department_name)
        if eligibility != "official":
            raise ArchiveValidationError(
                f"{department_name}.officialResults references a non-official "
                f"playerId: {player_id}"
            )
        official_result_ids.append(player_id)

    _ensure_unique(official_result_ids, f"{department_name}.officialResults")
    expected_official_ids = {
        player_id
        for player_id, player in players_by_id.items()
        if _as_mapping(
            player.get("rankingEligibility"),
            f"players[{player_id}].rankingEligibility",
        ).get(department_name)
        == "official"
    }
    if set(official_result_ids) != expected_official_ids:
        missing = sorted(expected_official_ids - set(official_result_ids))
        raise ArchiveValidationError(
            f"{department_name}.officialResults does not match official players"
            + (f"; missing: {', '.join(missing)}" if missing else "")
        )

    not_participating = {
        player_id
        for player_id, player in players_by_id.items()
        if _as_mapping(
            player.get("rankingEligibility"),
            f"players[{player_id}].rankingEligibility",
        ).get(department_name)
        == "notParticipating"
    }
    invalid_references = sorted(not_participating.intersection(referenced_ids))
    if invalid_references:
        raise ArchiveValidationError(
            f"{department_name} results reference notParticipating players: "
            f"{', '.join(invalid_references)}"
        )


def validate_archive(value: object) -> Mapping[str, object]:
    """Validate Archive 1.0 structure and cross-field references."""

    _validate_schema(value, ARCHIVE_SCHEMA_PATH)
    archive = _as_mapping(value, "archive")
    players = _as_list(archive.get("players"), "players")
    players_by_id: dict[str, Mapping[str, object]] = {}
    for raw_player in players:
        player = _as_mapping(raw_player, "players[]")
        player_id = _string(player, "playerId", "players[]")
        if player_id in players_by_id:
            raise ArchiveValidationError(f"Duplicate playerId: {player_id}")
        players_by_id[player_id] = player

    mahjong = _as_mapping(archive.get("mahjong"), "mahjong")
    games = _as_list(mahjong.get("games"), "mahjong.games")
    game_ids: list[str] = []
    mahjong_groups: list[list[object]] = []
    for raw_game in games:
        game = _as_mapping(raw_game, "mahjong.games[]")
        game_ids.append(_string(game, "gameId", "mahjong.games[]"))
        mahjong_groups.append(_as_list(game.get("results"), "mahjong.games[].results"))
    _ensure_unique(game_ids, "mahjong.games.gameId")
    _validate_department(
        mahjong,
        department_name="mahjong",
        players_by_id=players_by_id,
        result_groups=mahjong_groups,
    )

    raw_subgame = archive.get("subgame")
    if raw_subgame is None:
        invalid = [
            player_id
            for player_id, player in players_by_id.items()
            if _as_mapping(
                player.get("rankingEligibility"),
                f"players[{player_id}].rankingEligibility",
            ).get("subgame")
            != "notParticipating"
        ]
        if invalid:
            raise ArchiveValidationError(
                "subgame is null but some players are marked as participating"
            )
    else:
        subgame = _as_mapping(raw_subgame, "subgame")
        subgame_results = _as_list(subgame.get("results"), "subgame.results")
        subgame_groups_by_round: dict[object, list[object]] = {}
        for raw_result in subgame_results:
            result = _as_mapping(raw_result, "subgame.results[]")
            subgame_groups_by_round.setdefault(result.get("roundNumber"), []).append(
                raw_result
            )
        _validate_department(
            subgame,
            department_name="subgame",
            players_by_id=players_by_id,
            result_groups=list(subgame_groups_by_round.values()),
        )

    return archive


def validate_archive_players(
    archive: Mapping[str, object],
    registry: PlayerRegistry,
) -> None:
    """Require every Archive identity to exist in the private registry."""

    registry_by_id = {player["playerId"]: player for player in registry["players"]}
    for raw_player in _as_list(archive.get("players"), "players"):
        player = _as_mapping(raw_player, "players[]")
        player_id = _string(player, "playerId", "players[]")
        nickname = _string(player, "nickname", "players[]")
        registry_player = registry_by_id.get(player_id)
        if registry_player is None:
            raise ArchiveValidationError(f"Unregistered playerId: {player_id}")
        known_nicknames = {
            registry_player["currentNickname"].casefold(),
            *(name.casefold() for name in registry_player["previousNicknames"]),
        }
        if nickname.casefold() not in known_nicknames:
            raise ArchiveValidationError(
                f"Nickname does not belong to playerId {player_id}: {nickname}"
            )


def validate_archive_index(
    value: object,
    *,
    public_directory: Path | None = None,
) -> Mapping[str, object]:
    """Validate the public index and optionally verify every encrypted file."""

    _validate_schema(value, INDEX_SCHEMA_PATH)
    index = _as_mapping(value, "archive index")
    entries = _as_list(index.get("archives"), "archives")
    archive_ids: list[str] = []
    files: list[str] = []
    for raw_entry in entries:
        entry = _as_mapping(raw_entry, "archives[]")
        archive_ids.append(_string(entry, "archiveId", "archives[]"))
        relative_file = _string(entry, "file", "archives[]")
        files.append(relative_file)
        if public_directory is not None:
            target = (public_directory / relative_file).resolve()
            public_root = public_directory.resolve()
            if public_root not in target.parents or not target.is_file():
                raise ArchiveValidationError(
                    f"Archive index target does not exist: {relative_file}"
                )
    _ensure_unique(archive_ids, "archives.archiveId")
    _ensure_unique(files, "archives.file")
    return index

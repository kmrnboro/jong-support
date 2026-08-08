"""Validate, encrypt, and register a tournament Archive for GitHub Pages."""

from __future__ import annotations

import argparse
import getpass
import json
import sys
import tempfile
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import cast

if __package__:
    from .archive_crypto import (
        ARCHIVE_VERSION,
        ArchiveCryptoError,
        PBKDF2_ITERATIONS,
        decrypt_envelope,
        encrypt_bytes,
    )
    from .archive_validation import (
        ArchiveValidationError,
        validate_archive,
        validate_archive_index,
        validate_archive_players,
    )
    from .player_registry import PlayerRegistryError, load_registry
else:
    from archive_crypto import (
        ARCHIVE_VERSION,
        ArchiveCryptoError,
        PBKDF2_ITERATIONS,
        decrypt_envelope,
        encrypt_bytes,
    )
    from archive_validation import (
        ArchiveValidationError,
        validate_archive,
        validate_archive_index,
        validate_archive_players,
    )
    from player_registry import PlayerRegistryError, load_registry

DEFAULT_REGISTRY = Path("data/private/player-registry.json")
DEFAULT_PUBLIC_DIRECTORY = Path("apps/web/public")
INDEX_VERSION = "1.0.0"


class ArchivePublishError(Exception):
    """Raised when publication cannot complete without overwriting data."""


def _load_json(path: Path, description: str) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ArchivePublishError(f"{description} does not exist: {path}") from error
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ArchivePublishError(f"Could not read {description}: {path}") from error


def _mapping(value: object, field: str) -> Mapping[str, object]:
    if not isinstance(value, dict):
        raise ArchivePublishError(f"{field} must be an object")
    return cast(Mapping[str, object], value)


def _string(mapping: Mapping[str, object], key: str) -> str:
    value = mapping.get(key)
    if not isinstance(value, str):
        raise ArchivePublishError(f"{key} must be a string")
    return value


def _integer(mapping: Mapping[str, object], key: str) -> int:
    value = mapping.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        raise ArchivePublishError(f"{key} must be an integer")
    return value


def _read_index(index_path: Path) -> dict[str, object]:
    if not index_path.exists():
        return {"schemaVersion": INDEX_VERSION, "archives": []}
    return dict(validate_archive_index(_load_json(index_path, "Archive index")))


def _write_json_atomic(path: Path, value: object) -> None:
    serialized = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
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
        raise ArchivePublishError(f"Could not write file: {path}") from error


def publish_archive(
    input_path: Path,
    *,
    password: str,
    registry_path: Path = DEFAULT_REGISTRY,
    public_directory: Path = DEFAULT_PUBLIC_DIRECTORY,
    iterations: int = PBKDF2_ITERATIONS,
) -> tuple[Path, Path]:
    """Publish one new Archive without replacing existing public data."""

    archive = validate_archive(_load_json(input_path, "plaintext Archive"))
    try:
        plaintext = input_path.read_bytes()
    except OSError as error:
        raise ArchivePublishError(
            f"Could not read plaintext Archive: {input_path}"
        ) from error
    registry = load_registry(registry_path)
    validate_archive_players(archive, registry)

    if not public_directory.is_dir():
        raise ArchivePublishError(
            f"Public directory does not exist: {public_directory}"
        )
    archive_directory = public_directory / "archives"
    if not archive_directory.is_dir():
        raise ArchivePublishError(
            f"Archive directory does not exist: {archive_directory}"
        )

    tournament = _mapping(archive.get("tournament"), "tournament")
    archive_id = _string(tournament, "id")
    revision = _integer(tournament, "revision")
    output_name = f"{archive_id}-v{revision}.enc"
    output_path = archive_directory / output_name
    index_path = archive_directory / "index.json"
    if output_path.exists():
        raise ArchivePublishError(f"Encrypted Archive already exists: {output_path}")

    index = _read_index(index_path)
    raw_entries = index.get("archives")
    if not isinstance(raw_entries, list):
        raise ArchivePublishError("Archive index archives must be an array")
    entries = cast(list[object], raw_entries)
    for raw_entry in entries:
        entry = _mapping(raw_entry, "archives[]")
        if entry.get("archiveId") == archive_id:
            raise ArchivePublishError(
                f"archiveId already exists in the public index: {archive_id}"
            )

    players = archive.get("players")
    mahjong = _mapping(archive.get("mahjong"), "mahjong")
    games = mahjong.get("games")
    if not isinstance(players, list) or not isinstance(games, list):
        raise ArchivePublishError("Archive collections are invalid")
    entry: dict[str, object] = {
        "archiveId": archive_id,
        "title": _string(tournament, "name"),
        "date": _string(tournament, "date"),
        "revision": revision,
        "file": f"archives/{output_name}",
        "formatVersion": ARCHIVE_VERSION,
        "archiveSchemaVersion": _string(archive, "schemaVersion"),
        "playerCount": len(players),
        "gameCount": len(games),
        "hasSubgame": archive.get("subgame") is not None,
    }
    entries.append(entry)
    entries.sort(
        key=lambda item: _string(_mapping(item, "archives[]"), "date"),
        reverse=True,
    )

    envelope = encrypt_bytes(plaintext, password, iterations=iterations)
    if decrypt_envelope(envelope, password) != plaintext:
        raise ArchivePublishError("Post-encryption verification failed")

    created_output = False
    try:
        with output_path.open("x", encoding="utf-8", newline="\n") as output_file:
            created_output = True
            json.dump(envelope, output_file, ensure_ascii=False, indent=2)
            output_file.write("\n")
        validate_archive_index(index, public_directory=public_directory)
        _write_json_atomic(index_path, index)
    except Exception:
        if created_output:
            output_path.unlink(missing_ok=True)
        raise

    return output_path, index_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate and publish an encrypted Archive for GitHub Pages.",
    )
    parser.add_argument("input", type=Path, help="Plaintext Archive 1.0 JSON")
    parser.add_argument(
        "--registry",
        type=Path,
        default=DEFAULT_REGISTRY,
        help=f"Private player registry (default: {DEFAULT_REGISTRY})",
    )
    parser.add_argument(
        "--public-dir",
        type=Path,
        default=DEFAULT_PUBLIC_DIRECTORY,
        help=f"Vite public directory (default: {DEFAULT_PUBLIC_DIRECTORY})",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    password = getpass.getpass("Archive password: ")
    confirmation = getpass.getpass("Confirm archive password: ")
    if password != confirmation:
        print("Error: passwords do not match.", file=sys.stderr)
        return 2

    try:
        output_path, index_path = publish_archive(
            args.input,
            password=password,
            registry_path=args.registry,
            public_directory=args.public_dir,
        )
    except (
        ArchiveCryptoError,
        ArchivePublishError,
        ArchiveValidationError,
        PlayerRegistryError,
        OSError,
    ) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Encrypted Archive written to: {output_path}")
    print(f"Archive index updated: {index_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

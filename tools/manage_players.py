"""Manage the private cross-year player registry."""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from pathlib import Path

if __package__:
    from .player_registry import (
        PlayerRegistryError,
        RegistryPlayer,
        add_player,
        find_players,
        initialize_registry,
        load_registry,
        rename_player,
        save_registry,
    )
else:
    from player_registry import (
        PlayerRegistryError,
        RegistryPlayer,
        add_player,
        find_players,
        initialize_registry,
        load_registry,
        rename_player,
        save_registry,
    )

DEFAULT_REGISTRY = Path("data/private/player-registry.json")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Manage stable player IDs shared across tournament years.",
    )
    parser.add_argument(
        "--registry",
        type=Path,
        default=DEFAULT_REGISTRY,
        help=f"Private registry path (default: {DEFAULT_REGISTRY})",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("init", help="Create an empty registry")
    subparsers.add_parser("validate", help="Validate the registry")
    subparsers.add_parser("list", help="List every registered player")

    find_parser = subparsers.add_parser("find", help="Find an existing player")
    find_parser.add_argument("query", help="playerId or current/previous nickname")

    add_parser = subparsers.add_parser("add", help="Issue a new stable playerId")
    add_parser.add_argument("nickname", help="Current display nickname")
    add_parser.add_argument(
        "--allow-duplicate-nickname",
        action="store_true",
        help="Create a different person with an intentionally duplicated nickname",
    )

    rename_parser = subparsers.add_parser(
        "rename",
        help="Change a nickname without changing playerId",
    )
    rename_parser.add_argument("player_id", help="Existing stable playerId")
    rename_parser.add_argument("nickname", help="New display nickname")
    rename_parser.add_argument(
        "--allow-duplicate-nickname",
        action="store_true",
        help="Allow a nickname already associated with another playerId",
    )
    return parser


def _print_players(players: list[RegistryPlayer]) -> None:
    if not players:
        print("No players found.")
        return
    print("playerId\tcurrentNickname\tpreviousNicknames")
    for player in players:
        previous = ", ".join(str(item) for item in player["previousNicknames"])
        print(f'{player["playerId"]}\t{player["currentNickname"]}\t{previous}')


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    try:
        if args.command == "init":
            initialize_registry(args.registry)
            print(f"Player registry created: {args.registry}")
            return 0

        registry = load_registry(args.registry)

        if args.command == "validate":
            print(f"Player registry is valid: {args.registry}")
        elif args.command == "list":
            _print_players(registry["players"])
        elif args.command == "find":
            _print_players(find_players(registry, args.query))
        elif args.command == "add":
            player = add_player(
                registry,
                args.nickname,
                allow_duplicate_nickname=args.allow_duplicate_nickname,
            )
            save_registry(args.registry, registry)
            print(f'Player added: {player["playerId"]} ({player["currentNickname"]})')
        elif args.command == "rename":
            player = rename_player(
                registry,
                args.player_id,
                args.nickname,
                allow_duplicate_nickname=args.allow_duplicate_nickname,
            )
            save_registry(args.registry, registry)
            print(f'Player renamed: {player["playerId"]} ({player["currentNickname"]})')
    except PlayerRegistryError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

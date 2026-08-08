from __future__ import annotations

import io
import json
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from tools import manage_players
from tools.player_registry import (
    PlayerRegistryError,
    add_player,
    empty_registry,
    find_players,
    initialize_registry,
    load_registry,
    rename_player,
    save_registry,
    validate_registry,
)

PLAYER_ID_A = "player_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
PLAYER_ID_B = "player_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"


class PlayerRegistryTests(unittest.TestCase):
    def test_player_id_survives_nickname_change_and_old_name_is_searchable(self) -> None:
        registry = empty_registry()
        player = add_player(registry, "Player A", id_factory=lambda: PLAYER_ID_A)

        renamed = rename_player(registry, PLAYER_ID_A, "Player Alpha")

        self.assertEqual(player["playerId"], PLAYER_ID_A)
        self.assertEqual(renamed["playerId"], PLAYER_ID_A)
        self.assertEqual(renamed["currentNickname"], "Player Alpha")
        self.assertEqual(renamed["previousNicknames"], ["Player A"])
        self.assertEqual(find_players(registry, "Player A"), [renamed])
        self.assertEqual(find_players(registry, "alpha"), [renamed])

    def test_duplicate_nickname_requires_an_explicit_distinct_person_choice(self) -> None:
        registry = empty_registry()
        add_player(registry, "Same Name", id_factory=lambda: PLAYER_ID_A)

        with self.assertRaisesRegex(PlayerRegistryError, "Nickname already exists"):
            add_player(registry, "same name", id_factory=lambda: PLAYER_ID_B)

        second = add_player(
            registry,
            "same name",
            allow_duplicate_nickname=True,
            id_factory=lambda: PLAYER_ID_B,
        )
        self.assertEqual(second["playerId"], PLAYER_ID_B)

    def test_unknown_player_id_cannot_be_renamed_or_reused(self) -> None:
        registry = empty_registry()

        with self.assertRaisesRegex(PlayerRegistryError, "Unknown playerId"):
            rename_player(registry, PLAYER_ID_A, "Someone")

    def test_duplicate_player_ids_are_rejected(self) -> None:
        invalid_registry = {
            "schemaVersion": "1.0.0",
            "players": [
                {
                    "playerId": PLAYER_ID_A,
                    "currentNickname": "Player A",
                    "previousNicknames": [],
                },
                {
                    "playerId": PLAYER_ID_A,
                    "currentNickname": "Player B",
                    "previousNicknames": [],
                },
            ],
        }

        with self.assertRaisesRegex(PlayerRegistryError, "Duplicate playerId"):
            validate_registry(invalid_registry)

    def test_registry_is_saved_and_loaded_as_utf8_json(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "private" / "player-registry.json"
            initialize_registry(path)
            registry = load_registry(path)
            add_player(registry, "雀士A", id_factory=lambda: PLAYER_ID_A)
            save_registry(path, registry)

            self.assertEqual(load_registry(path), registry)
            self.assertIn("雀士A", path.read_text(encoding="utf-8"))

    def test_cli_initializes_validates_and_finds_players(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "player-registry.json"
            output = io.StringIO()
            errors = io.StringIO()

            with redirect_stdout(output), redirect_stderr(errors):
                self.assertEqual(
                    manage_players.main(["--registry", str(path), "init"]),
                    0,
                )
                self.assertEqual(
                    manage_players.main(
                        ["--registry", str(path), "add", "CLI Player"]
                    ),
                    0,
                )
                self.assertEqual(
                    manage_players.main(
                        ["--registry", str(path), "find", "CLI Player"]
                    ),
                    0,
                )
                self.assertEqual(
                    manage_players.main(["--registry", str(path), "validate"]),
                    0,
                )

            stored = json.loads(path.read_text(encoding="utf-8"))
            player_id = stored["players"][0]["playerId"]
            self.assertRegex(player_id, r"^player_[0-9a-f]{32}$")
            self.assertIn(player_id, output.getvalue())
            self.assertEqual(errors.getvalue(), "")


if __name__ == "__main__":
    unittest.main()

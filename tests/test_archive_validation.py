from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from tools.archive_validation import (
    ArchiveValidationError,
    validate_archive,
    validate_archive_index,
    validate_archive_players,
)
from tools.player_registry import load_registry

FIXTURE_DIRECTORY = Path(__file__).parent / "fixtures"
REPOSITORY_ROOT = Path(__file__).parent.parent


def load_fixture(name: str) -> object:
    return json.loads((FIXTURE_DIRECTORY / name).read_text(encoding="utf-8"))


@pytest.mark.parametrize("name", ["archive.json", "archive-no-subgame.json"])
def test_archive_1_0_fixtures_are_valid(name: str) -> None:
    archive = validate_archive(load_fixture(name))
    validate_archive_players(
        archive,
        load_registry(FIXTURE_DIRECTORY / "player-registry.json"),
    )


def test_reference_player_is_kept_in_games_but_excluded_from_official_results() -> None:
    archive = validate_archive(load_fixture("archive.json"))
    mahjong = archive["mahjong"]
    assert isinstance(mahjong, dict)
    games = mahjong["games"]
    official_results = mahjong["officialResults"]
    assert isinstance(games, list)
    assert isinstance(official_results, list)

    reference_id = "player_00000000000000000000000000000008"
    assert any(
        result["playerId"] == reference_id
        for game in games
        for result in game["results"]
    )
    assert all(result["playerId"] != reference_id for result in official_results)


def test_non_official_player_cannot_appear_in_official_results() -> None:
    archive = copy.deepcopy(load_fixture("archive.json"))
    assert isinstance(archive, dict)
    archive["mahjong"]["officialResults"].append(
        {
            "playerId": "player_00000000000000000000000000000008",
            "point": -65,
            "rank": 8,
        }
    )

    with pytest.raises(ArchiveValidationError, match="non-official"):
        validate_archive(archive)


def test_null_subgame_requires_not_participating_eligibility() -> None:
    archive = copy.deepcopy(load_fixture("archive-no-subgame.json"))
    assert isinstance(archive, dict)
    archive["players"][0]["rankingEligibility"]["subgame"] = "official"

    with pytest.raises(ArchiveValidationError, match="subgame is null"):
        validate_archive(archive)


def test_unknown_scoring_rule_and_extra_parameters_are_rejected() -> None:
    archive = copy.deepcopy(load_fixture("archive.json"))
    assert isinstance(archive, dict)
    archive["mahjong"]["scoring"]["ruleId"] = "javascript"

    with pytest.raises(ArchiveValidationError):
        validate_archive(archive)

    archive = copy.deepcopy(load_fixture("archive.json"))
    assert isinstance(archive, dict)
    archive["mahjong"]["scoring"]["parameters"]["formula"] = "eval(input)"

    with pytest.raises(ArchiveValidationError):
        validate_archive(archive)


def test_registry_rejects_unknown_id_and_mismatched_nickname() -> None:
    registry = load_registry(FIXTURE_DIRECTORY / "player-registry.json")
    archive = copy.deepcopy(load_fixture("archive.json"))
    assert isinstance(archive, dict)
    archive["players"][0]["nickname"] = "Different Person"

    validated = validate_archive(archive)
    with pytest.raises(ArchiveValidationError, match="does not belong"):
        validate_archive_players(validated, registry)


def test_archive_index_rejects_duplicate_ids_and_missing_files(tmp_path: Path) -> None:
    public_directory = tmp_path / "public"
    archive_directory = public_directory / "archives"
    archive_directory.mkdir(parents=True)
    value = {
        "schemaVersion": "1.0.0",
        "archives": [
            {
                "archiveId": "sample",
                "title": "Sample",
                "date": "2026-07-01",
                "revision": 1,
                "file": "archives/sample-v1.enc",
                "formatVersion": 1,
                "archiveSchemaVersion": "1.0.0",
                "playerCount": 8,
                "gameCount": 4,
                "hasSubgame": True,
            }
        ],
    }

    with pytest.raises(ArchiveValidationError, match="does not exist"):
        validate_archive_index(value, public_directory=public_directory)

    (archive_directory / "sample-v1.enc").write_text("{}", encoding="utf-8")
    value["archives"].append(dict(value["archives"][0]))
    with pytest.raises(ArchiveValidationError, match="contains duplicates"):
        validate_archive_index(value, public_directory=public_directory)


def test_public_archive_index_matches_schema_and_references_existing_files() -> None:
    public_directory = REPOSITORY_ROOT / "apps/web/public"
    index = json.loads(
        (public_directory / "archives/index.json").read_text(encoding="utf-8")
    )

    validate_archive_index(index, public_directory=public_directory)

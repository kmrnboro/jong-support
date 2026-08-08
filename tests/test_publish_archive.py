from __future__ import annotations

import json
from pathlib import Path

import pytest

import tools.publish_archive as publish_archive_module
from tools.archive_crypto import decrypt_envelope, encrypt_bytes
from tools.publish_archive import ArchivePublishError, publish_archive

FIXTURE_DIRECTORY = Path(__file__).parent / "fixtures"
PASSWORD = "test-publication-password"


def test_publish_archive_encrypts_verifies_and_updates_index(tmp_path: Path) -> None:
    public_directory = tmp_path / "public"
    (public_directory / "archives").mkdir(parents=True)

    encrypted_path, index_path = publish_archive(
        FIXTURE_DIRECTORY / "archive.json",
        password=PASSWORD,
        registry_path=FIXTURE_DIRECTORY / "player-registry.json",
        public_directory=public_directory,
        iterations=1_000,
    )

    envelope = json.loads(encrypted_path.read_text(encoding="utf-8"))
    assert decrypt_envelope(envelope, PASSWORD) == (
        FIXTURE_DIRECTORY / "archive.json"
    ).read_bytes()
    index = json.loads(index_path.read_text(encoding="utf-8"))
    assert index["schemaVersion"] == "1.0.0"
    assert index["archives"][0]["archiveId"] == "2026-sample"
    assert index["archives"][0]["file"] == "archives/2026-sample-v1.enc"


def test_publish_archive_rejects_duplicate_archive_id_without_changes(
    tmp_path: Path,
) -> None:
    public_directory = tmp_path / "public"
    (public_directory / "archives").mkdir(parents=True)
    arguments = {
        "password": PASSWORD,
        "registry_path": FIXTURE_DIRECTORY / "player-registry.json",
        "public_directory": public_directory,
        "iterations": 1_000,
    }
    publish_archive(FIXTURE_DIRECTORY / "archive.json", **arguments)
    original_index = (public_directory / "archives/index.json").read_bytes()

    with pytest.raises(ArchivePublishError, match="already exists"):
        publish_archive(FIXTURE_DIRECTORY / "archive.json", **arguments)

    assert (public_directory / "archives/index.json").read_bytes() == original_index


def test_publish_archive_does_not_delete_competing_output(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    public_directory = tmp_path / "public"
    archive_directory = public_directory / "archives"
    archive_directory.mkdir(parents=True)
    output_path = archive_directory / "2026-sample-v1.enc"
    competing_content = b"created by another process"

    def encrypt_after_competing_write(
        plaintext: bytes,
        password: str,
        *,
        iterations: int,
    ) -> object:
        output_path.write_bytes(competing_content)
        return encrypt_bytes(plaintext, password, iterations=iterations)

    monkeypatch.setattr(
        publish_archive_module,
        "encrypt_bytes",
        encrypt_after_competing_write,
    )

    with pytest.raises(FileExistsError):
        publish_archive(
            FIXTURE_DIRECTORY / "archive.json",
            password=PASSWORD,
            registry_path=FIXTURE_DIRECTORY / "player-registry.json",
            public_directory=public_directory,
            iterations=1_000,
        )

    assert output_path.read_bytes() == competing_content


def test_two_years_share_stable_player_ids_and_publish_without_web_changes(
    tmp_path: Path,
) -> None:
    public_directory = tmp_path / "public"
    (public_directory / "archives").mkdir(parents=True)

    for name in ("archive.json", "archive-no-subgame.json"):
        publish_archive(
            FIXTURE_DIRECTORY / name,
            password=PASSWORD,
            registry_path=FIXTURE_DIRECTORY / "player-registry.json",
            public_directory=public_directory,
            iterations=1_000,
        )

    index = json.loads(
        (public_directory / "archives/index.json").read_text(encoding="utf-8")
    )
    assert [entry["archiveId"] for entry in index["archives"]] == [
        "2026-sample",
        "2025-sample",
    ]

    archives = [
        json.loads((FIXTURE_DIRECTORY / name).read_text(encoding="utf-8"))
        for name in ("archive.json", "archive-no-subgame.json")
    ]
    shared_ids = {
        player["playerId"] for player in archives[0]["players"]
    }.intersection(player["playerId"] for player in archives[1]["players"])
    assert shared_ids == {
        "player_00000000000000000000000000000001",
        "player_00000000000000000000000000000002",
        "player_00000000000000000000000000000003",
        "player_00000000000000000000000000000004",
    }

from __future__ import annotations

import base64
import json
from pathlib import Path

import pytest

from tools import decrypt_archive, encrypt_archive
from tools.archive_crypto import (
    ArchiveAuthenticationError,
    ArchiveInputError,
    ArchiveOutputExistsError,
    decrypt_envelope,
    decrypt_file,
    encrypt_bytes,
    encrypt_file,
)

TEST_ITERATIONS = 1_000
PASSWORD = "correct horse battery staple"


def test_encrypt_and_decrypt_file_round_trip(tmp_path: Path) -> None:
    source = tmp_path / "archive.json"
    encrypted = tmp_path / "archive.enc"
    decrypted = tmp_path / "archive.decrypted.json"
    plaintext = b'{"schemaVersion":"0.1.0","players":[]}\n'
    source.write_bytes(plaintext)

    encrypt_file(
        source,
        encrypted,
        PASSWORD,
        iterations=TEST_ITERATIONS,
    )
    decrypt_file(encrypted, decrypted, PASSWORD)

    envelope = json.loads(encrypted.read_text(encoding="utf-8"))
    assert envelope["format"] == "mahjong-archive-encrypted"
    assert envelope["version"] == 1
    assert envelope["kdf"]["iterations"] == TEST_ITERATIONS
    assert source.read_bytes() == plaintext
    assert decrypted.read_bytes() == plaintext


def test_wrong_password_is_rejected() -> None:
    envelope = encrypt_bytes(
        b'{"schemaVersion":"0.1.0"}',
        PASSWORD,
        iterations=TEST_ITERATIONS,
    )

    with pytest.raises(ArchiveAuthenticationError):
        decrypt_envelope(envelope, "wrong password")


def test_tampered_ciphertext_is_rejected() -> None:
    envelope = encrypt_bytes(
        b'{"schemaVersion":"0.1.0"}',
        PASSWORD,
        iterations=TEST_ITERATIONS,
    )
    ciphertext = bytearray(base64.b64decode(envelope["cipher"]["ciphertext"]))
    ciphertext[0] ^= 1
    envelope["cipher"]["ciphertext"] = base64.b64encode(ciphertext).decode("ascii")

    with pytest.raises(ArchiveAuthenticationError):
        decrypt_envelope(envelope, PASSWORD)


def test_empty_plaintext_file_is_rejected(tmp_path: Path) -> None:
    source = tmp_path / "empty.json"
    encrypted = tmp_path / "empty.enc"
    source.write_bytes(b"")

    with pytest.raises(ArchiveInputError, match="must not be empty"):
        encrypt_file(
            source,
            encrypted,
            PASSWORD,
            iterations=TEST_ITERATIONS,
        )

    assert not encrypted.exists()


def test_random_salt_and_iv_are_used_for_each_encryption() -> None:
    first = encrypt_bytes(b"{}", PASSWORD, iterations=TEST_ITERATIONS)
    second = encrypt_bytes(b"{}", PASSWORD, iterations=TEST_ITERATIONS)

    assert first["kdf"]["salt"] != second["kdf"]["salt"]
    assert first["cipher"]["iv"] != second["cipher"]["iv"]
    assert first["cipher"]["ciphertext"] != second["cipher"]["ciphertext"]


def test_existing_output_is_never_overwritten(tmp_path: Path) -> None:
    source = tmp_path / "archive.json"
    output = tmp_path / "archive.enc"
    source.write_text("{}", encoding="utf-8")
    output.write_text("keep me", encoding="utf-8")

    with pytest.raises(ArchiveOutputExistsError):
        encrypt_file(
            source,
            output,
            PASSWORD,
            iterations=TEST_ITERATIONS,
        )

    assert output.read_text(encoding="utf-8") == "keep me"


def test_cli_round_trip_keeps_password_out_of_output(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    source = tmp_path / "archive.json"
    encrypted = tmp_path / "archive.enc"
    decrypted = tmp_path / "archive.decrypted.json"
    source.write_text('{"schemaVersion":"0.1.0"}', encoding="utf-8")
    monkeypatch.setattr(
        encrypt_archive.getpass,
        "getpass",
        lambda _prompt: PASSWORD,
    )

    assert encrypt_archive.main([str(source), str(encrypted)]) == 0
    assert decrypt_archive.main([str(encrypted), str(decrypted)]) == 0
    captured = capsys.readouterr()

    assert decrypted.read_bytes() == source.read_bytes()
    assert PASSWORD not in captured.out
    assert PASSWORD not in captured.err


def test_encrypt_cli_rejects_password_confirmation_mismatch(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    source = tmp_path / "archive.json"
    encrypted = tmp_path / "archive.enc"
    source.write_text("{}", encoding="utf-8")
    answers = iter([PASSWORD, "different password"])
    monkeypatch.setattr(
        encrypt_archive.getpass,
        "getpass",
        lambda _prompt: next(answers),
    )

    assert encrypt_archive.main([str(source), str(encrypted)]) == 2
    assert not encrypted.exists()

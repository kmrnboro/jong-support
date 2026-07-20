"""Shared archive encryption primitives for the local CLI tools."""

from __future__ import annotations

import base64
import binascii
import json
import os
from collections.abc import Mapping
from pathlib import Path
from typing import TypedDict

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ARCHIVE_FORMAT = "mahjong-archive-encrypted"
ARCHIVE_VERSION = 1
PBKDF2_ITERATIONS = 600_000
MAX_PBKDF2_ITERATIONS = 10_000_000
SALT_LENGTH = 16
IV_LENGTH = 12
KEY_LENGTH_BYTES = 32
KEY_LENGTH_BITS = KEY_LENGTH_BYTES * 8


class KdfEnvelope(TypedDict):
    name: str
    hash: str
    iterations: int
    salt: str


class CipherEnvelope(TypedDict):
    name: str
    keyLength: int
    iv: str
    ciphertext: str


class EncryptedArchiveEnvelope(TypedDict):
    format: str
    version: int
    kdf: KdfEnvelope
    cipher: CipherEnvelope


class ArchiveCryptoError(Exception):
    """Base class for expected archive crypto failures."""


class ArchiveInputError(ArchiveCryptoError):
    """Raised when a plaintext or encrypted input file is invalid."""


class ArchiveFormatError(ArchiveCryptoError):
    """Raised when an encrypted envelope has an unsupported format."""


class ArchiveAuthenticationError(ArchiveCryptoError):
    """Raised for a wrong password or an authenticated-data failure."""


class ArchiveOutputExistsError(ArchiveCryptoError):
    """Raised when a CLI output path already exists."""


def _derive_key(password: str, salt: bytes, iterations: int) -> bytes:
    if not password:
        raise ArchiveInputError("Password must not be empty")
    if iterations < 1 or iterations > MAX_PBKDF2_ITERATIONS:
        raise ArchiveFormatError("PBKDF2 iterations are outside the supported range")

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LENGTH_BYTES,
        salt=salt,
        iterations=iterations,
    )
    return kdf.derive(password.encode("utf-8"))


def _encode_base64(value: bytes) -> str:
    return base64.b64encode(value).decode("ascii")


def _decode_base64(value: object, field_name: str) -> bytes:
    if not isinstance(value, str):
        raise ArchiveFormatError(f"{field_name} must be a Base64 string")

    try:
        return base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ArchiveFormatError(f"{field_name} is not valid Base64") from error


def _as_mapping(value: object, field_name: str) -> Mapping[str, object]:
    if not isinstance(value, dict):
        raise ArchiveFormatError(f"{field_name} must be an object")
    return value


def _get_integer(mapping: Mapping[str, object], field_name: str) -> int:
    value = mapping.get(field_name)
    if isinstance(value, bool) or not isinstance(value, int):
        raise ArchiveFormatError(f"{field_name} must be an integer")
    return value


def encrypt_bytes(
    plaintext: bytes,
    password: str,
    *,
    iterations: int = PBKDF2_ITERATIONS,
) -> EncryptedArchiveEnvelope:
    """Encrypt bytes into the version 1 JSON-compatible envelope."""

    salt = os.urandom(SALT_LENGTH)
    iv = os.urandom(IV_LENGTH)
    key = _derive_key(password, salt, iterations)
    ciphertext = AESGCM(key).encrypt(iv, plaintext, None)

    return {
        "format": ARCHIVE_FORMAT,
        "version": ARCHIVE_VERSION,
        "kdf": {
            "name": "PBKDF2",
            "hash": "SHA-256",
            "iterations": iterations,
            "salt": _encode_base64(salt),
        },
        "cipher": {
            "name": "AES-GCM",
            "keyLength": KEY_LENGTH_BITS,
            "iv": _encode_base64(iv),
            "ciphertext": _encode_base64(ciphertext),
        },
    }


def decrypt_envelope(
    envelope: Mapping[str, object],
    password: str,
) -> bytes:
    """Authenticate and decrypt a version 1 archive envelope."""

    if envelope.get("format") != ARCHIVE_FORMAT:
        raise ArchiveFormatError("Unsupported encrypted archive format")
    if envelope.get("version") != ARCHIVE_VERSION:
        raise ArchiveFormatError("Unsupported encrypted archive version")

    kdf = _as_mapping(envelope.get("kdf"), "kdf")
    cipher = _as_mapping(envelope.get("cipher"), "cipher")

    if kdf.get("name") != "PBKDF2" or kdf.get("hash") != "SHA-256":
        raise ArchiveFormatError("Unsupported key derivation settings")
    if cipher.get("name") != "AES-GCM":
        raise ArchiveFormatError("Unsupported cipher settings")
    if cipher.get("keyLength") != KEY_LENGTH_BITS:
        raise ArchiveFormatError("Unsupported AES key length")

    iterations = _get_integer(kdf, "iterations")
    salt = _decode_base64(kdf.get("salt"), "kdf.salt")
    iv = _decode_base64(cipher.get("iv"), "cipher.iv")
    ciphertext = _decode_base64(cipher.get("ciphertext"), "cipher.ciphertext")

    if len(salt) != SALT_LENGTH:
        raise ArchiveFormatError("kdf.salt has an unsupported length")
    if len(iv) != IV_LENGTH:
        raise ArchiveFormatError("cipher.iv has an unsupported length")
    if len(ciphertext) < 16:
        raise ArchiveFormatError("cipher.ciphertext is too short")

    key = _derive_key(password, salt, iterations)

    try:
        return AESGCM(key).decrypt(iv, ciphertext, None)
    except InvalidTag as error:
        raise ArchiveAuthenticationError(
            "Decryption failed: wrong password or corrupted archive"
        ) from error


def _validate_plain_archive(plaintext: bytes) -> None:
    if not plaintext.strip():
        raise ArchiveInputError("Input archive JSON must not be empty")

    try:
        value: object = json.loads(plaintext.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ArchiveInputError("Input archive must be valid UTF-8 JSON") from error

    if not isinstance(value, dict):
        raise ArchiveInputError("Input archive JSON must contain an object")


def _read_plain_archive(input_path: Path) -> bytes:
    try:
        plaintext = input_path.read_bytes()
    except FileNotFoundError as error:
        raise ArchiveInputError(f"Input file does not exist: {input_path}") from error
    except OSError as error:
        raise ArchiveInputError(f"Could not read input file: {input_path}") from error

    _validate_plain_archive(plaintext)
    return plaintext


def _read_envelope(input_path: Path) -> Mapping[str, object]:
    try:
        text = input_path.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        raise ArchiveInputError(f"Input file does not exist: {input_path}") from error
    except (OSError, UnicodeDecodeError) as error:
        raise ArchiveInputError(f"Could not read encrypted archive: {input_path}") from error

    try:
        value: object = json.loads(text)
    except json.JSONDecodeError as error:
        raise ArchiveFormatError("Encrypted archive is not valid JSON") from error

    return _as_mapping(value, "encrypted archive")


def _ensure_output_available(input_path: Path, output_path: Path) -> None:
    if input_path.resolve() == output_path.resolve():
        raise ArchiveOutputExistsError("Input and output paths must be different")
    if output_path.exists():
        raise ArchiveOutputExistsError(f"Output file already exists: {output_path}")
    if not output_path.parent.exists():
        raise ArchiveInputError(
            f"Output directory does not exist: {output_path.parent}"
        )


def encrypt_file(
    input_path: Path,
    output_path: Path,
    password: str,
    *,
    iterations: int = PBKDF2_ITERATIONS,
) -> None:
    """Encrypt a JSON file, verify it in memory, then create the output file."""

    _ensure_output_available(input_path, output_path)
    plaintext = _read_plain_archive(input_path)
    envelope = encrypt_bytes(plaintext, password, iterations=iterations)

    if decrypt_envelope(envelope, password) != plaintext:
        raise ArchiveCryptoError("Post-encryption verification failed")

    serialized = json.dumps(envelope, ensure_ascii=False, indent=2) + "\n"
    try:
        with output_path.open("x", encoding="utf-8", newline="\n") as output_file:
            output_file.write(serialized)
    except FileExistsError as error:
        raise ArchiveOutputExistsError(
            f"Output file already exists: {output_path}"
        ) from error


def decrypt_file(
    input_path: Path,
    output_path: Path,
    password: str,
) -> None:
    """Decrypt an envelope and create a plaintext JSON output file."""

    _ensure_output_available(input_path, output_path)
    envelope = _read_envelope(input_path)
    plaintext = decrypt_envelope(envelope, password)
    _validate_plain_archive(plaintext)

    try:
        with output_path.open("xb") as output_file:
            output_file.write(plaintext)
    except FileExistsError as error:
        raise ArchiveOutputExistsError(
            f"Output file already exists: {output_path}"
        ) from error


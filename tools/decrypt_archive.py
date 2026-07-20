"""Decrypt a tournament archive from the command line."""

from __future__ import annotations

import argparse
import getpass
import sys
from collections.abc import Sequence
from pathlib import Path

if __package__:
    from .archive_crypto import ArchiveCryptoError, decrypt_file
else:
    from archive_crypto import ArchiveCryptoError, decrypt_file


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Decrypt an AES-256-GCM tournament archive.",
    )
    parser.add_argument("input", type=Path, help="Encrypted Archive file")
    parser.add_argument("output", type=Path, help="New plaintext JSON output file")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    password = getpass.getpass("Archive password: ")

    try:
        decrypt_file(args.input, args.output, password)
    except ArchiveCryptoError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Decrypted archive written to: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


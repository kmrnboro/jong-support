"""Encrypt a plaintext tournament archive from the command line."""

from __future__ import annotations

import argparse
import getpass
import sys
from collections.abc import Sequence
from pathlib import Path

if __package__:
    from .archive_crypto import ArchiveCryptoError, encrypt_file
else:
    from archive_crypto import ArchiveCryptoError, encrypt_file


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Encrypt a tournament Archive JSON using AES-256-GCM.",
    )
    parser.add_argument("input", type=Path, help="Plaintext Archive JSON")
    parser.add_argument("output", type=Path, help="New encrypted output file")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    password = getpass.getpass("Archive password: ")
    confirmation = getpass.getpass("Confirm archive password: ")

    if password != confirmation:
        print("Error: passwords do not match.", file=sys.stderr)
        return 2

    try:
        encrypt_file(args.input, args.output, password)
    except ArchiveCryptoError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1

    print(f"Encrypted archive written to: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


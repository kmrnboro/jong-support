import type { TournamentArchive } from "../domain/archive";
import { ArchiveDecryptionError, decryptArchive } from "./decrypt";
import { isTournamentArchive } from "./schemaValidation";

export class ArchiveLoadError extends Error {
  constructor() {
    super("アーカイブを取得できませんでした。");
    this.name = "ArchiveLoadError";
  }
}

export { isTournamentArchive };

export function parseArchive(plaintext: Uint8Array): TournamentArchive {
  let value: unknown;

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    value = JSON.parse(text);
  } catch {
    throw new ArchiveDecryptionError();
  }

  if (!isTournamentArchive(value)) {
    throw new ArchiveDecryptionError();
  }

  return value;
}

export async function loadEncryptedArchive(
  url: string,
  password: string,
): Promise<TournamentArchive> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new ArchiveLoadError();
  }

  if (!response.ok) {
    throw new ArchiveLoadError();
  }

  let envelope: unknown;
  try {
    envelope = await response.json();
  } catch {
    throw new ArchiveDecryptionError();
  }

  const plaintext = await decryptArchive(envelope, password);
  return parseArchive(plaintext);
}

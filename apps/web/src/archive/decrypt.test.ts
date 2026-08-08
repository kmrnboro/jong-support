import { describe, expect, it } from "vitest";

import encryptedArchiveWithoutSubgameText from "../../public/archives/2025-sample-v1.enc?raw";
import encryptedArchiveText from "../../public/archives/2026-sample-v1.enc?raw";
import plainArchiveWithoutSubgame from "../../../../tests/fixtures/archive-no-subgame.json";
import plainArchive from "../../../../tests/fixtures/archive.json";
import {
  ArchiveDecryptionError,
  DECRYPTION_ERROR_MESSAGE,
  type EncryptedArchiveEnvelope,
  UnsupportedEncryptedArchiveError,
  decryptArchive,
} from "./decrypt";

const FIXTURE_PASSWORD = "weekend-mvp-2026";
const encryptedArchive = JSON.parse(
  encryptedArchiveText,
) as EncryptedArchiveEnvelope;
const encryptedArchiveWithoutSubgame = JSON.parse(
  encryptedArchiveWithoutSubgameText,
) as EncryptedArchiveEnvelope;

function replaceCiphertextByte(value: typeof encryptedArchive) {
  const tampered = structuredClone(value);
  const binary = atob(tampered.cipher.ciphertext);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  bytes[0] ^= 1;
  tampered.cipher.ciphertext = btoa(
    Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""),
  );
  return tampered;
}

describe("decryptArchive", () => {
  it("Python CLI互換fixtureをWeb Crypto APIで復号する", async () => {
    const plaintext = await decryptArchive(encryptedArchive, FIXTURE_PASSWORD);
    const parsed: unknown = JSON.parse(new TextDecoder().decode(plaintext));

    expect(parsed).toEqual(plainArchive);
  });

  it("サブゲームなしの別年度fixtureも復号する", async () => {
    const plaintext = await decryptArchive(
      encryptedArchiveWithoutSubgame,
      FIXTURE_PASSWORD,
    );

    expect(JSON.parse(new TextDecoder().decode(plaintext))).toEqual(
      plainArchiveWithoutSubgame,
    );
  });

  it("誤パスワードと改ざんに同じエラーを返す", async () => {
    await Promise.all([
      expect(
        decryptArchive(encryptedArchive, "wrong-password"),
      ).rejects.toEqual(new ArchiveDecryptionError()),
      expect(
        decryptArchive(
          replaceCiphertextByte(encryptedArchive),
          FIXTURE_PASSWORD,
        ),
      ).rejects.toEqual(new ArchiveDecryptionError()),
    ]);

    expect(new ArchiveDecryptionError().message).toBe(
      DECRYPTION_ERROR_MESSAGE,
    );
  });

  it("未対応のenvelope versionを復号前に拒否する", async () => {
    await expect(
      decryptArchive({ ...encryptedArchive, version: 2 }, FIXTURE_PASSWORD),
    ).rejects.toBeInstanceOf(UnsupportedEncryptedArchiveError);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import encryptedArchiveText from "../../public/archives/2026-sample.enc?raw";
import plainArchive from "../../../../tests/fixtures/archive.json";
import {
  ArchiveDecryptionError,
  type EncryptedArchiveEnvelope,
} from "./decrypt";
import {
  ArchiveLoadError,
  isTournamentArchive,
  loadEncryptedArchive,
  parseArchive,
} from "./loadArchive";

const FIXTURE_PASSWORD = "weekend-mvp-2026";
const encryptedArchive = JSON.parse(
  encryptedArchiveText,
) as EncryptedArchiveEnvelope;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Archive validation", () => {
  it("復号済みfixtureを最小Archiveモデルとして受け入れる", () => {
    expect(isTournamentArchive(plainArchive)).toBe(true);
    expect(
      parseArchive(new TextEncoder().encode(JSON.stringify(plainArchive))),
    ).toEqual(plainArchive);
  });

  it("復号後の不正JSONを復号エラーとして扱う", () => {
    expect(() => parseArchive(new TextEncoder().encode("not json"))).toThrow(
      ArchiveDecryptionError,
    );
  });

  it("復号後のJSONが最小Archive構造を満たさない場合は拒否する", () => {
    const incompleteArchive = new TextEncoder().encode(
      JSON.stringify({ schemaVersion: "0.1.0" }),
    );

    expect(() => parseArchive(incompleteArchive)).toThrow(
      ArchiveDecryptionError,
    );
  });
});

describe("loadEncryptedArchive", () => {
  it("パスワードを送信せず暗号Archiveを取得・復号する", async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(
        new Response(JSON.stringify(encryptedArchive), { status: 200 }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loadEncryptedArchive("/archives/2026-sample.enc", FIXTURE_PASSWORD),
    ).resolves.toEqual(plainArchive);
    expect(fetchMock).toHaveBeenCalledWith("/archives/2026-sample.enc");
  });

  it("HTTPエラーを取得エラーとして扱う", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.resolve(new Response(null, { status: 404 }))),
    );

    await expect(
      loadEncryptedArchive("/missing.enc", FIXTURE_PASSWORD),
    ).rejects.toBeInstanceOf(ArchiveLoadError);
  });
});

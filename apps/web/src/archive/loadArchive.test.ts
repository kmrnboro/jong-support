import { afterEach, describe, expect, it, vi } from "vitest";

import encryptedArchiveText from "../../public/archives/2026-sample-v1.enc?raw";
import plainArchive from "../../../../tests/fixtures/archive.json";
import {
  calculateMahjongProgressions,
  calculateSubgameProgressions,
} from "../domain/statistics";
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

  it("各部門の最終累積ptが公式結果と一致する", () => {
    const archive = parseArchive(
      new TextEncoder().encode(JSON.stringify(plainArchive)),
    );
    const mahjongProgressions = calculateMahjongProgressions(
      archive.players,
      archive.mahjong.games,
    );
    expect(archive.subgame).not.toBeNull();
    const subgameProgressions = calculateSubgameProgressions(
      archive.players,
      archive.subgame?.results ?? [],
    );

    for (const result of archive.mahjong.officialResults) {
      expect(
        mahjongProgressions
          .find((item) => item.playerId === result.playerId)
          ?.points.at(-1)?.point,
      ).toBe(result.point);
    }
    for (const result of archive.subgame?.officialResults ?? []) {
      expect(
        subgameProgressions
          .find((item) => item.playerId === result.playerId)
          ?.points.at(-1)?.point,
      ).toBe(result.point);
    }
  });

  it("復号後の不正JSONを復号エラーとして扱う", () => {
    expect(() => parseArchive(new TextEncoder().encode("not json"))).toThrow(
      ArchiveDecryptionError,
    );
  });

  it("復号後のJSONが最小Archive構造を満たさない場合は拒否する", () => {
    const incompleteArchive = new TextEncoder().encode(
      JSON.stringify({ schemaVersion: "1.0.0" }),
    );

    expect(() => parseArchive(incompleteArchive)).toThrow(
      ArchiveDecryptionError,
    );
  });

  it("未登録playerIdを参照するArchiveを拒否する", () => {
    expect(
      isTournamentArchive({
        ...plainArchive,
        subgame: {
          ...plainArchive.subgame,
          results: [{ roundNumber: 1, playerId: "UNKNOWN", point: 10 }],
        },
      }),
    ).toBe(false);
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
      loadEncryptedArchive("/archives/2026-sample-v1.enc", FIXTURE_PASSWORD),
    ).resolves.toEqual(plainArchive);
    expect(fetchMock).toHaveBeenCalledWith("/archives/2026-sample-v1.enc");
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

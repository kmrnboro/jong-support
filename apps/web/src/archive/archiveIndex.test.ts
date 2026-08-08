import { afterEach, describe, expect, it, vi } from "vitest";

import archiveIndexText from "../../public/archives/index.json?raw";
import {
  ArchiveIndexLoadError,
  loadArchiveIndex,
} from "./archiveIndex";
import { isArchiveIndex } from "./schemaValidation";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Archive index", () => {
  it("公開indexから複数年度を検証できる", () => {
    const parsed: unknown = JSON.parse(archiveIndexText);

    expect(isArchiveIndex(parsed)).toBe(true);
    if (isArchiveIndex(parsed)) {
      expect(parsed.archives.map((entry) => entry.archiveId)).toEqual([
        "2026-sample",
        "2025-sample",
      ]);
    }
  });

  it("実行時にindexを取得する", async () => {
    const value: unknown = JSON.parse(archiveIndexText);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve(
          new Response(JSON.stringify(value), { status: 200 }),
        ),
      ),
    );

    await expect(loadArchiveIndex("/archives/index.json")).resolves.toEqual(
      value,
    );
  });

  it("不正indexと取得失敗を同じ利用者向けエラーにする", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve(new Response("{}", { status: 200 })),
      ),
    );
    await expect(
      loadArchiveIndex("/archives/index.json"),
    ).rejects.toBeInstanceOf(ArchiveIndexLoadError);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve(new Response(null, { status: 404 })),
      ),
    );
    await expect(
      loadArchiveIndex("/archives/index.json"),
    ).rejects.toBeInstanceOf(ArchiveIndexLoadError);
  });
});

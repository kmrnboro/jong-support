import { describe, expect, it } from "vitest";

import { buildArchivePath, buildPlayerPath } from "./routes";

describe("buildArchivePath", () => {
  it("URLで安全に使えるアーカイブパスを返す", () => {
    expect(buildArchivePath("2026 summer")).toBe("/archive/2026%20summer");
  });

  it("URLで安全に使えるプレイヤーパスを返す", () => {
    expect(buildPlayerPath("Player 01")).toBe("/player/Player%2001");
  });
});

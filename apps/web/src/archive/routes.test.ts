import { describe, expect, it } from "vitest";

import { buildArchivePath, buildStatisticsPath } from "./routes";

describe("buildArchivePath", () => {
  it("URLで安全に使えるアーカイブパスを返す", () => {
    expect(buildArchivePath("2026 summer")).toBe("/archive/2026%20summer");
  });

  it("URLで安全に使える統計パスを返す", () => {
    expect(buildStatisticsPath("2026 summer")).toBe(
      "/archive/2026%20summer/statistics",
    );
  });
});

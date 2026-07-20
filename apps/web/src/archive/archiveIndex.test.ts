import { describe, expect, it } from "vitest";

import archiveIndexText from "../../public/archives/index.json?raw";
import { sampleArchiveEntry } from "./archiveIndex";

describe("Archive index", () => {
  it("公開indexと画面表示用メタデータが一致する", () => {
    const parsed: unknown = JSON.parse(archiveIndexText);

    expect(parsed).toEqual({ archives: [sampleArchiveEntry] });
  });
});

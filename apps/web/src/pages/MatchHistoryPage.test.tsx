import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { describe, expect, it } from "vitest";

import plainArchive from "../../../../tests/fixtures/archive.json";
import { parseArchive } from "../archive/loadArchive";
import { MatchHistoryPage } from "./MatchHistoryPage";

describe("MatchHistoryPage", () => {
  it("fixtureの対局を回戦・卓ごとに表示する", () => {
    const archive = parseArchive(
      new TextEncoder().encode(JSON.stringify(plainArchive)),
    );
    const html = renderToStaticMarkup(
      <StaticRouter location="/archive/2026-sample/matches">
        <MatchHistoryPage archive={archive} />
      </StaticRouter>,
    );

    expect(html).toContain("1回戦・1卓");
    expect(html).toContain("2回戦・2卓");
    expect(html).toContain("Player H");
    expect(html).toContain("参考");
    expect(html).toContain("40,000");
    expect(html).toContain("+30");
  });
});

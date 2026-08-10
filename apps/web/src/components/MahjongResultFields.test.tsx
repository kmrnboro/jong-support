import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  TournamentResultSummary,
  ValidationDialog,
} from "./MahjongResultFields";

const players = [
  { playerId: "P001", nickname: "Player A" },
  { playerId: "P002", nickname: "Player B" },
  { playerId: "P003", nickname: "Player C" },
  { playerId: "P004", nickname: "Player D" },
];

describe("tournament result feedback", () => {
  it("確認結果を着順順で素点とともに表示する", () => {
    const html = renderToStaticMarkup(
      <TournamentResultSummary
        players={players}
        results={[
          { initialSeat: "east", playerId: "P001", rawScore: 10_000, rank: 4, finalPoint: -15 },
          { initialSeat: "south", playerId: "P002", rawScore: 20_000, rank: 3, finalPoint: -5 },
          { initialSeat: "west", playerId: "P003", rawScore: 30_000, rank: 2, finalPoint: 5 },
          { initialSeat: "north", playerId: "P004", rawScore: 40_000, rank: 1, finalPoint: 15 },
        ]}
        title="最終着順と素点"
      />,
    );

    expect(html.indexOf("Player D")).toBeLessThan(html.indexOf("Player A"));
    expect(html).toContain("1位");
    expect(html).toContain("40,000点");
  });

  it("検証理由とOKボタンをダイアログへ表示する", () => {
    const html = renderToStaticMarkup(
      <ValidationDialog message="素点合計が不正です。" onClose={() => undefined} />,
    );

    expect(html).toContain('role="alertdialog"');
    expect(html).toContain("素点合計が不正です。");
    expect(html).toContain(">OK</button>");
  });
});

import { describe, expect, it } from "vitest";

import { createSampleTournamentSession } from "./sampleSession";
import {
  closeTournament,
  correctGame,
  createLiveRanking,
  createRawScoreProgressions,
  type GameInput,
  registerGame,
  resumeTournament,
  startTournament,
} from "./session";

const validInput: GameInput = {
  roundNumber: 1,
  tableNumber: 1,
  results: [
    { initialSeat: "east", playerId: "P001", rawScore: 40_000 },
    { initialSeat: "south", playerId: "P002", rawScore: 30_000 },
    { initialSeat: "west", playerId: "P003", rawScore: 20_000 },
    { initialSeat: "north", playerId: "P004", rawScore: 10_000 },
  ],
};

function activeSession() {
  return startTournament(createSampleTournamentSession());
}

describe("tournament session", () => {
  it("元状態を変更せず大会を開始・入力終了・再開する", () => {
    const preparing = createSampleTournamentSession();
    const active = startTournament(preparing);
    const closed = closeTournament(active);
    const resumed = resumeTournament(closed);

    expect(preparing.tournament.status).toBe("preparing");
    expect(active.tournament.status).toBe("active");
    expect(closed.tournament.status).toBe("closed");
    expect(resumed.tournament.status).toBe("active");
  });

  it("東南西北の結果を登録して暫定順位を作る", () => {
    const active = activeSession();
    const registered = registerGame(active, validInput);
    const ranking = createLiveRanking(registered);

    expect(active.games).toHaveLength(0);
    expect(registered.games[0]?.results.map((result) => result.rank)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(registered.games[0]?.results.map((result) => result.finalPoint)).toEqual([
      15, 5, -5, -15,
    ]);
    expect(ranking[0]).toMatchObject({ playerId: "P001", totalPoint: 15 });
    expect(ranking).toHaveLength(4);
  });

  it("素点合計を固定値ではなく持ち点の4倍で検証する", () => {
    const session = activeSession();
    const differentStartingScore = {
      ...session,
      tournament: { ...session.tournament, startingScore: 30_000 },
    };
    const registered = registerGame(differentStartingScore, {
      ...validInput,
      results: [
        { initialSeat: "east", playerId: "P001", rawScore: 45_000 },
        { initialSeat: "south", playerId: "P002", rawScore: 35_000 },
        { initialSeat: "west", playerId: "P003", rawScore: 25_000 },
        { initialSeat: "north", playerId: "P004", rawScore: 15_000 },
      ],
    });

    expect(registered.games).toHaveLength(1);
  });

  it("登録済み対局から参加者ごとの素点推移を作る", () => {
    const registered = registerGame(activeSession(), validInput);
    const progressions = createRawScoreProgressions(registered);

    expect(progressions).toHaveLength(4);
    expect(progressions[0]).toMatchObject({
      playerId: "P001",
      points: [
        { roundNumber: 0, point: 25_000 },
        { roundNumber: 1, point: 40_000 },
      ],
    });
  });

  it("開催状態、参加者、回・卓、素点合計の不正を拒否する", () => {
    expect(() => registerGame(createSampleTournamentSession(), validInput)).toThrow(
      "大会開催中",
    );
    expect(() =>
      registerGame(activeSession(), {
        ...validInput,
        results: validInput.results.map((result, index) =>
          index === 1 ? { ...result, playerId: "P001" } : result,
        ),
      }),
    ).toThrow("同じ参加者");
    expect(() =>
      registerGame(activeSession(), {
        ...validInput,
        results: validInput.results.map((result, index) =>
          index === 0 ? { ...result, rawScore: 39_900 } : result,
        ),
      }),
    ).toThrow("持ち点 × 4");

    const registered = registerGame(activeSession(), validInput);
    expect(() => registerGame(registered, validInput)).toThrow("登録済み");
  });

  it("理由付き訂正を履歴へ残し順位を再計算する", () => {
    const registered = registerGame(activeSession(), validInput);
    const corrected = correctGame(registered, registered.games[0]!.gameId, {
      ...validInput,
      reason: "転記誤り",
      results: [
        { initialSeat: "east", playerId: "P001", rawScore: 20_000 },
        { initialSeat: "south", playerId: "P002", rawScore: 50_000 },
        { initialSeat: "west", playerId: "P003", rawScore: 20_000 },
        { initialSeat: "north", playerId: "P004", rawScore: 10_000 },
      ],
    });

    expect(registered.games[0]?.revision).toBe(1);
    expect(corrected.games[0]?.revision).toBe(2);
    expect(corrected.corrections[0]).toMatchObject({ reason: "転記誤り" });
    expect(createLiveRanking(corrected)[0]?.playerId).toBe("P002");
  });

  it("空の訂正理由と訂正後の素点合計不正を拒否する", () => {
    const registered = registerGame(activeSession(), validInput);
    const gameId = registered.games[0]!.gameId;

    expect(() =>
      correctGame(registered, gameId, { ...validInput, reason: " " }),
    ).toThrow("訂正理由");
    expect(() =>
      correctGame(registered, gameId, {
        ...validInput,
        reason: "修正",
        results: validInput.results.map((result, index) =>
          index === 0 ? { ...result, rawScore: 39_000 } : result,
        ),
      }),
    ).toThrow("持ち点 × 4");
  });
});

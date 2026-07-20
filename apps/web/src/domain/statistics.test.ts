import { describe, expect, it } from "vitest";

import type { MahjongGame } from "./archive";
import { calculatePlayerStatistics } from "./statistics";

const games: MahjongGame[] = [
  {
    gameId: "R01-T01",
    roundNumber: 1,
    tableNumber: 1,
    results: [
      { playerId: "P001", rawScore: 40_000, rank: 1, finalPoint: 30 },
      { playerId: "P002", rawScore: 30_000, rank: 2, finalPoint: 10 },
      { playerId: "P003", rawScore: 20_000, rank: 3, finalPoint: -10 },
      { playerId: "P004", rawScore: 10_000, rank: 4, finalPoint: -30 },
    ],
  },
  {
    gameId: "R02-T01",
    roundNumber: 2,
    tableNumber: 1,
    results: [
      { playerId: "P002", rawScore: 45_000, rank: 1, finalPoint: 35 },
      { playerId: "P003", rawScore: 25_000, rank: 2, finalPoint: 5 },
      { playerId: "P004", rawScore: 20_000, rank: 3, finalPoint: -10 },
      { playerId: "P001", rawScore: 10_000, rank: 4, finalPoint: -30 },
    ],
  },
];

describe("calculatePlayerStatistics", () => {
  it("gamesから対局数、平均順位、トップ率、ラス率を計算する", () => {
    expect(calculatePlayerStatistics("P001", games)).toEqual({
      playerId: "P001",
      gameCount: 2,
      averageRank: 2.5,
      topRate: 0.5,
      lastRate: 0.5,
    });
  });

  it("対局がない場合は割合を0ではなくnullにする", () => {
    expect(calculatePlayerStatistics("P999", games)).toEqual({
      playerId: "P999",
      gameCount: 0,
      averageRank: null,
      topRate: null,
      lastRate: null,
    });
  });
});


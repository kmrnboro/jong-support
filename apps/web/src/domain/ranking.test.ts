import { describe, expect, it } from "vitest";

import type { TournamentArchive } from "./archive";
import { createOfficialRanking } from "./ranking";

const archive: TournamentArchive = {
  schemaVersion: "1.0.0",
  exportedAt: "2026-07-01T12:00:00Z",
  tournament: {
    id: "ranking-test",
    name: "Ranking Test",
    date: "2026-07-01",
    revision: 1,
  },
  players: [
    {
      playerId: "P001",
      nickname: "Player A",
      rankingEligibility: { mahjong: "official", subgame: "official" },
    },
    {
      playerId: "P002",
      nickname: "Player B",
      rankingEligibility: { mahjong: "official", subgame: "official" },
    },
  ],
  mahjong: {
    scoring: {
      ruleId: "stored-final-points",
      ruleVersion: "1.0.0",
      parameters: {},
    },
    games: [],
    officialResults: [
      { playerId: "P001", point: 100, rank: 2 },
      { playerId: "P002", point: -100, rank: 1 },
    ],
  },
  subgame: {
    dataStatus: "sample",
    scoring: {
      ruleId: "stored-final-points",
      ruleVersion: "1.0.0",
      parameters: {},
    },
    results: [],
    officialResults: [
      { playerId: "P001", point: 20, rank: 1 },
      { playerId: "P002", point: 10, rank: 2 },
    ],
  },
  exportMetadata: {
    generator: "test",
    source: "sample",
  },
};

describe("createOfficialRanking", () => {
  it("ポイントを再計算せず部門ごとの公式順位に並べる", () => {
    const mahjongRanking = createOfficialRanking(archive, "mahjong");
    const subgameRanking = createOfficialRanking(archive, "subgame");

    expect(mahjongRanking.map((row) => row.playerId)).toEqual([
      "P002",
      "P001",
    ]);
    expect(subgameRanking.map((row) => row.playerId)).toEqual([
      "P001",
      "P002",
    ]);
    expect(mahjongRanking.map((row) => row.nickname)).toEqual([
      "Player B",
      "Player A",
    ]);
  });

  it("officialResultsが未知のplayerIdを参照している場合は失敗する", () => {
    const invalidArchive: TournamentArchive = {
      ...archive,
      mahjong: {
        ...archive.mahjong,
        officialResults: [{ playerId: "UNKNOWN", point: 0, rank: 1 }],
      },
    };

    expect(() => createOfficialRanking(invalidArchive, "mahjong")).toThrow(
      "Unknown playerId in officialResults: UNKNOWN",
    );
  });
});

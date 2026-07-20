import { describe, expect, it } from "vitest";

import type { TournamentArchive } from "./archive";
import { createOfficialRanking } from "./ranking";

const archive: TournamentArchive = {
  schemaVersion: "0.2.0",
  tournament: {
    id: "ranking-test",
    name: "Ranking Test",
    date: "2026-07-01",
  },
  players: [
    { playerId: "P001", nickname: "Player A" },
    { playerId: "P002", nickname: "Player B" },
  ],
  games: [],
  subgameResults: [],
  subgameDataStatus: "sample",
  officialResults: [
    {
      playerId: "P001",
      mahjongPoint: 100,
      mahjongRank: 2,
      subgamePoint: 20,
      subgameRank: 1,
    },
    {
      playerId: "P002",
      mahjongPoint: -100,
      mahjongRank: 1,
      subgamePoint: 10,
      subgameRank: 2,
    },
  ],
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
      officialResults: [
        {
          playerId: "UNKNOWN",
          mahjongPoint: 0,
          mahjongRank: 1,
          subgamePoint: 0,
          subgameRank: 1,
        },
      ],
    };

    expect(() => createOfficialRanking(invalidArchive, "mahjong")).toThrow(
      "Unknown playerId in officialResults: UNKNOWN",
    );
  });
});

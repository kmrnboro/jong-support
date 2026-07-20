import { describe, expect, it } from "vitest";

import type { TournamentArchive } from "./archive";
import { createOfficialRanking } from "./ranking";

const archive: TournamentArchive = {
  schemaVersion: "0.1.0",
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
  officialResults: [
    {
      playerId: "P001",
      mahjongPoint: 100,
      subgamePoint: 0,
      totalPoint: 100,
      rank: 2,
    },
    {
      playerId: "P002",
      mahjongPoint: -100,
      subgamePoint: 0,
      totalPoint: -100,
      rank: 1,
    },
  ],
};

describe("createOfficialRanking", () => {
  it("ポイントを再計算せずofficialResultsのrank順に並べる", () => {
    const ranking = createOfficialRanking(archive);

    expect(ranking.map((row) => row.playerId)).toEqual(["P002", "P001"]);
    expect(ranking.map((row) => row.nickname)).toEqual([
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
          subgamePoint: 0,
          totalPoint: 0,
          rank: 1,
        },
      ],
    };

    expect(() => createOfficialRanking(invalidArchive)).toThrow(
      "Unknown playerId in officialResults: UNKNOWN",
    );
  });
});


import type { TournamentSession } from "./session";

export function createSampleTournamentSession(): TournamentSession {
  return {
    tournament: {
      id: "weekend-prototype",
      name: "週末大会プロトタイプ",
      status: "preparing",
      startingScore: 25_000,
    },
    players: [
      { playerId: "P001", nickname: "Player A" },
      { playerId: "P002", nickname: "Player B" },
      { playerId: "P003", nickname: "Player C" },
      { playerId: "P004", nickname: "Player D" },
      { playerId: "P005", nickname: "Player E" },
      { playerId: "P006", nickname: "Player F" },
      { playerId: "P007", nickname: "Player G" },
      { playerId: "P008", nickname: "とても長いニックネームの参加者" },
    ],
    games: [],
    corrections: [],
  };
}

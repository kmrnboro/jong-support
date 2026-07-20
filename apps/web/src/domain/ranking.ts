import type { TournamentArchive } from "./archive";

export type RankingCategory = "mahjong" | "subgame";

export type OfficialRankingRow = {
  playerId: string;
  nickname: string;
  point: number;
  rank: number;
};

export function createOfficialRanking(
  archive: TournamentArchive,
  category: RankingCategory,
): OfficialRankingRow[] {
  const nicknameByPlayerId = new Map(
    archive.players.map((player) => [player.playerId, player.nickname]),
  );

  const pointKey = category === "mahjong" ? "mahjongPoint" : "subgamePoint";
  const rankKey = category === "mahjong" ? "mahjongRank" : "subgameRank";

  return archive.officialResults
    .map((result) => ({
      playerId: result.playerId,
      point: result[pointKey],
      rank: result[rankKey],
    }))
    .sort((left, right) => left.rank - right.rank)
    .map((result) => {
      const nickname = nicknameByPlayerId.get(result.playerId);

      if (nickname === undefined) {
        throw new Error(`Unknown playerId in officialResults: ${result.playerId}`);
      }

      return { ...result, nickname };
    });
}

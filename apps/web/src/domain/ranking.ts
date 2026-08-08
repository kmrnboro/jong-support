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

  const results =
    category === "mahjong"
      ? archive.mahjong.officialResults
      : (archive.subgame?.officialResults ?? []);

  return [...results]
    .sort((left, right) => left.rank - right.rank)
    .map((result) => {
      const nickname = nicknameByPlayerId.get(result.playerId);

      if (nickname === undefined) {
        throw new Error(`Unknown playerId in officialResults: ${result.playerId}`);
      }

      return { ...result, nickname };
    });
}

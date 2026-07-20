import type { OfficialResult, TournamentArchive } from "./archive";

export type OfficialRankingRow = OfficialResult & {
  nickname: string;
};

export function createOfficialRanking(
  archive: TournamentArchive,
): OfficialRankingRow[] {
  const nicknameByPlayerId = new Map(
    archive.players.map((player) => [player.playerId, player.nickname]),
  );

  return [...archive.officialResults]
    .sort((left, right) => left.rank - right.rank)
    .map((result) => {
      const nickname = nicknameByPlayerId.get(result.playerId);

      if (nickname === undefined) {
        throw new Error(`Unknown playerId in officialResults: ${result.playerId}`);
      }

      return { ...result, nickname };
    });
}


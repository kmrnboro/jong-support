import type { GameRank, MahjongGame } from "./archive";

export type PlayerStatistics = {
  playerId: string;
  gameCount: number;
  averageRank: number | null;
  topRate: number | null;
  lastRate: number | null;
};

export function calculatePlayerStatistics(
  playerId: string,
  games: readonly MahjongGame[],
): PlayerStatistics {
  const ranks: GameRank[] = [];

  for (const game of games) {
    for (const result of game.results) {
      if (result.playerId === playerId) {
        ranks.push(result.rank);
      }
    }
  }

  const gameCount = ranks.length;

  if (gameCount === 0) {
    return {
      playerId,
      gameCount,
      averageRank: null,
      topRate: null,
      lastRate: null,
    };
  }

  const rankTotal = ranks.reduce((total, rank) => total + rank, 0);
  const topCount = ranks.filter((rank) => rank === 1).length;
  const lastCount = ranks.filter((rank) => rank === 4).length;

  return {
    playerId,
    gameCount,
    averageRank: rankTotal / gameCount,
    topRate: topCount / gameCount,
    lastRate: lastCount / gameCount,
  };
}


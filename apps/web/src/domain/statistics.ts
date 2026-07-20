import type {
  GameRank,
  MahjongGame,
  Player,
  SubgameResult,
} from "./archive";

export type PlayerStatistics = {
  playerId: string;
  gameCount: number;
  averageRank: number | null;
  topRate: number | null;
  lastRate: number | null;
};

export type PointProgress = {
  roundNumber: number;
  point: number;
};

export type PlayerPointProgression = {
  playerId: string;
  nickname: string;
  points: PointProgress[];
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

type PointEntry = {
  roundNumber: number;
  playerId: string;
  point: number;
};

function calculatePointProgressions(
  players: readonly Player[],
  entries: readonly PointEntry[],
): PlayerPointProgression[] {
  const rounds = [...new Set(entries.map((entry) => entry.roundNumber))].sort(
    (left, right) => left - right,
  );

  return players.map((player) => {
    let total = 0;

    return {
      playerId: player.playerId,
      nickname: player.nickname,
      points: [
        { roundNumber: 0, point: 0 },
        ...rounds.map((roundNumber) => {
          total += entries
            .filter(
              (entry) =>
                entry.roundNumber === roundNumber &&
                entry.playerId === player.playerId,
            )
            .reduce((sum, entry) => sum + entry.point, 0);

          return { roundNumber, point: total };
        }),
      ],
    };
  });
}

export function calculateMahjongProgressions(
  players: readonly Player[],
  games: readonly MahjongGame[],
): PlayerPointProgression[] {
  return calculatePointProgressions(
    players,
    games.flatMap((game) =>
      game.results.map((result) => ({
        roundNumber: game.roundNumber,
        playerId: result.playerId,
        point: result.finalPoint,
      })),
    ),
  );
}

export function calculateSubgameProgressions(
  players: readonly Player[],
  results: readonly SubgameResult[],
): PlayerPointProgression[] {
  return calculatePointProgressions(players, results);
}

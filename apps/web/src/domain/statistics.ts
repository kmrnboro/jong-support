import type {
  GameRank,
  MahjongGame,
  Player,
  SubgameResult,
  TournamentArchive,
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

export type ArchiveStatisticsSummary = {
  archiveId: string;
  date: string;
  players: Array<{
    playerId: string;
    nickname: string;
    gameCount: number;
    rankTotal: number;
    topCount: number;
    lastCount: number;
    mahjongChampion: boolean;
    subgameChampion: boolean;
  }>;
};

export type CrossYearPlayerStatistics = PlayerStatistics & {
  nickname: string;
  tournamentCount: number;
  mahjongChampionships: number;
  subgameChampionships: number;
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

export function summarizeArchive(
  archive: TournamentArchive,
): ArchiveStatisticsSummary {
  const mahjongResults = new Map(
    archive.mahjong.officialResults.map((result) => [result.playerId, result]),
  );
  const subgameResults = new Map(
    (archive.subgame?.officialResults ?? []).map((result) => [
      result.playerId,
      result,
    ]),
  );
  const ranksByPlayer = new Map<string, GameRank[]>();
  for (const game of archive.mahjong.games) {
    for (const result of game.results) {
      const ranks = ranksByPlayer.get(result.playerId) ?? [];
      ranks.push(result.rank);
      ranksByPlayer.set(result.playerId, ranks);
    }
  }
  const subgameParticipants = new Set(
    (archive.subgame?.results ?? []).map((result) => result.playerId),
  );

  return {
    archiveId: archive.tournament.id,
    date: archive.tournament.date,
    players: archive.players
      .filter(
        (player) =>
          mahjongResults.has(player.playerId) ||
          subgameResults.has(player.playerId) ||
          ranksByPlayer.has(player.playerId) ||
          subgameParticipants.has(player.playerId),
      )
      .map((player) => {
        const ranks = ranksByPlayer.get(player.playerId) ?? [];

        return {
          playerId: player.playerId,
          nickname: player.nickname,
          gameCount: ranks.length,
          rankTotal: ranks.reduce((total, rank) => total + rank, 0),
          topCount: ranks.filter((rank) => rank === 1).length,
          lastCount: ranks.filter((rank) => rank === 4).length,
          mahjongChampion: mahjongResults.get(player.playerId)?.rank === 1,
          subgameChampion: subgameResults.get(player.playerId)?.rank === 1,
        };
      }),
  };
}

export function calculateCrossYearStatistics(
  archives: readonly ArchiveStatisticsSummary[],
): CrossYearPlayerStatistics[] {
  const totals = new Map<
    string,
    {
      playerId: string;
      nickname: string;
      latestDate: string;
      tournamentCount: number;
      gameCount: number;
      rankTotal: number;
      topCount: number;
      lastCount: number;
      mahjongChampionships: number;
      subgameChampionships: number;
    }
  >();

  for (const archive of archives) {
    for (const player of archive.players) {
      const current = totals.get(player.playerId) ?? {
        playerId: player.playerId,
        nickname: player.nickname,
        latestDate: archive.date,
        tournamentCount: 0,
        gameCount: 0,
        rankTotal: 0,
        topCount: 0,
        lastCount: 0,
        mahjongChampionships: 0,
        subgameChampionships: 0,
      };
      if (archive.date >= current.latestDate) {
        current.nickname = player.nickname;
        current.latestDate = archive.date;
      }
      current.tournamentCount += 1;
      current.gameCount += player.gameCount;
      current.rankTotal += player.rankTotal;
      current.topCount += player.topCount;
      current.lastCount += player.lastCount;
      current.mahjongChampionships += Number(player.mahjongChampion);
      current.subgameChampionships += Number(player.subgameChampion);
      totals.set(player.playerId, current);
    }
  }

  return [...totals.values()]
    .map((player) => ({
      playerId: player.playerId,
      nickname: player.nickname,
      tournamentCount: player.tournamentCount,
      gameCount: player.gameCount,
      averageRank:
        player.gameCount === 0 ? null : player.rankTotal / player.gameCount,
      topRate:
        player.gameCount === 0 ? null : player.topCount / player.gameCount,
      lastRate:
        player.gameCount === 0 ? null : player.lastCount / player.gameCount,
      mahjongChampionships: player.mahjongChampionships,
      subgameChampionships: player.subgameChampionships,
    }))
    .sort(
      (left, right) =>
        right.mahjongChampionships - left.mahjongChampionships ||
        right.tournamentCount - left.tournamentCount ||
        left.nickname.localeCompare(right.nickname, "ja"),
    );
}

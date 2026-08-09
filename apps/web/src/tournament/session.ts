export const INITIAL_SEATS = ["east", "south", "west", "north"] as const;

export type InitialSeat = (typeof INITIAL_SEATS)[number];
export type TournamentStatus = "preparing" | "active" | "closed";

export const SEAT_LABELS: Record<InitialSeat, string> = {
  east: "東",
  south: "南",
  west: "西",
  north: "北",
};

export type TournamentPlayer = {
  playerId: string;
  nickname: string;
};

export type RawGameResult = {
  initialSeat: InitialSeat;
  playerId: string;
  rawScore: number;
};

export type LiveGameResult = RawGameResult & {
  rank: 1 | 2 | 3 | 4;
  finalPoint: number;
};

export type LiveGame = {
  gameId: string;
  roundNumber: number;
  tableNumber: number;
  revision: number;
  results: LiveGameResult[];
};

export type GameCorrection = {
  correctionId: string;
  gameId: string;
  reason: string;
  before: LiveGame;
  after: LiveGame;
};

export type TournamentSession = {
  tournament: {
    id: string;
    name: string;
    status: TournamentStatus;
    startingScore: number;
  };
  players: TournamentPlayer[];
  games: LiveGame[];
  corrections: GameCorrection[];
};

export type GameInput = {
  roundNumber: number;
  tableNumber: number;
  results: RawGameResult[];
};

export type CorrectionInput = GameInput & {
  reason: string;
};

export type LiveRankingRow = TournamentPlayer & {
  rank: number;
  gameCount: number;
  totalPoint: number;
};

function requirePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label}は1以上の整数で入力してください。`);
  }
}

function validateResults(
  session: TournamentSession,
  results: RawGameResult[],
) {
  if (results.length !== INITIAL_SEATS.length) {
    throw new Error("4名分の結果を入力してください。");
  }

  const seats = new Set(results.map((result) => result.initialSeat));
  if (!INITIAL_SEATS.every((seat) => seats.has(seat))) {
    throw new Error("東・南・西・北を1名ずつ入力してください。");
  }

  const playerIds = results.map((result) => result.playerId);
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error("同じ参加者を複数の席へ登録できません。");
  }

  const registeredIds = new Set(session.players.map((player) => player.playerId));
  if (playerIds.some((playerId) => !registeredIds.has(playerId))) {
    throw new Error("未登録の参加者が含まれています。");
  }

  if (results.some((result) => !Number.isInteger(result.rawScore))) {
    throw new Error("素点は整数で入力してください。");
  }

  const total = results.reduce((sum, result) => sum + result.rawScore, 0);
  if (total !== session.tournament.startingScore * INITIAL_SEATS.length) {
    throw new Error("素点合計を「持ち点 × 4」に合わせてください。");
  }
}

function validateGameInput(
  session: TournamentSession,
  input: GameInput,
  ignoredGameId?: string,
) {
  requirePositiveInteger(input.roundNumber, "回番号");
  requirePositiveInteger(input.tableNumber, "卓番号");
  validateResults(session, input.results);

  const duplicate = session.games.some(
    (game) =>
      game.gameId !== ignoredGameId &&
      game.roundNumber === input.roundNumber &&
      game.tableNumber === input.tableNumber,
  );
  if (duplicate) {
    throw new Error("同じ回・卓の結果は登録済みです。");
  }
}

export function calculatePrototypeResults(
  startingScore: number,
  results: RawGameResult[],
): LiveGameResult[] {
  const ordered = [...results].sort(
    (left, right) =>
      right.rawScore - left.rawScore ||
      INITIAL_SEATS.indexOf(left.initialSeat) -
        INITIAL_SEATS.indexOf(right.initialSeat),
  );
  const rankBySeat = new Map(
    ordered.map((result, index) => [result.initialSeat, index + 1]),
  );

  return results.map((result) => ({
    ...result,
    rank: rankBySeat.get(result.initialSeat) as 1 | 2 | 3 | 4,
    finalPoint: (result.rawScore - startingScore) / 1_000,
  }));
}

export function startTournament(session: TournamentSession): TournamentSession {
  if (session.tournament.status !== "preparing") {
    throw new Error("開始前の大会だけ開始できます。");
  }
  return {
    ...session,
    tournament: { ...session.tournament, status: "active" },
  };
}

export function closeTournament(session: TournamentSession): TournamentSession {
  if (session.tournament.status !== "active") {
    throw new Error("開催中の大会だけ終了できます。");
  }
  return {
    ...session,
    tournament: { ...session.tournament, status: "closed" },
  };
}

export function registerGame(
  session: TournamentSession,
  input: GameInput,
): TournamentSession {
  if (session.tournament.status !== "active") {
    throw new Error("大会開催中だけ結果を登録できます。");
  }
  validateGameInput(session, input);

  const game: LiveGame = {
    gameId: `round-${input.roundNumber}-table-${input.tableNumber}`,
    roundNumber: input.roundNumber,
    tableNumber: input.tableNumber,
    revision: 1,
    results: calculatePrototypeResults(
      session.tournament.startingScore,
      input.results,
    ),
  };
  return { ...session, games: [...session.games, game] };
}

export function correctGame(
  session: TournamentSession,
  gameId: string,
  input: CorrectionInput,
): TournamentSession {
  if (session.tournament.status === "preparing") {
    throw new Error("開始前の大会結果は訂正できません。");
  }
  const before = session.games.find((game) => game.gameId === gameId);
  if (before === undefined) {
    throw new Error("訂正対象の対局が見つかりません。");
  }
  if (input.reason.trim() === "") {
    throw new Error("訂正理由を入力してください。");
  }
  validateGameInput(session, input, gameId);

  const after: LiveGame = {
    gameId,
    roundNumber: input.roundNumber,
    tableNumber: input.tableNumber,
    revision: before.revision + 1,
    results: calculatePrototypeResults(
      session.tournament.startingScore,
      input.results,
    ),
  };
  const correction: GameCorrection = {
    correctionId: `${gameId}-revision-${after.revision}`,
    gameId,
    reason: input.reason.trim(),
    before,
    after,
  };

  return {
    ...session,
    games: session.games.map((game) => (game.gameId === gameId ? after : game)),
    corrections: [...session.corrections, correction],
  };
}

export function createLiveRanking(
  session: TournamentSession,
): LiveRankingRow[] {
  const rows = session.players.map((player) => {
    const results = session.games.flatMap((game) =>
      game.results.filter((result) => result.playerId === player.playerId),
    );
    return {
      ...player,
      rank: 0,
      gameCount: results.length,
      totalPoint: results.reduce((sum, result) => sum + result.finalPoint, 0),
    };
  });

  return rows
    .filter((row) => row.gameCount > 0)
    .sort(
      (left, right) =>
        right.totalPoint - left.totalPoint ||
        left.nickname.localeCompare(right.nickname, "ja") ||
        left.playerId.localeCompare(right.playerId),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

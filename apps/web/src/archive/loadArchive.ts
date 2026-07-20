import type {
  GameRank,
  GameResult,
  MahjongGame,
  OfficialResult,
  Player,
  SubgameResult,
  Tournament,
  TournamentArchive,
} from "../domain/archive";
import { ArchiveDecryptionError, decryptArchive } from "./decrypt";

export class ArchiveLoadError extends Error {
  constructor() {
    super("アーカイブを取得できませんでした。");
    this.name = "ArchiveLoadError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGameRank(value: unknown): value is GameRank {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function isTournament(value: unknown): value is Tournament {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.date === "string"
  );
}

function isPlayer(value: unknown): value is Player {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.nickname === "string"
  );
}

function isGameResult(value: unknown): value is GameResult {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.rawScore === "number" &&
    isGameRank(value.rank) &&
    typeof value.finalPoint === "number"
  );
}

function isMahjongGame(value: unknown): value is MahjongGame {
  return (
    isRecord(value) &&
    typeof value.gameId === "string" &&
    typeof value.roundNumber === "number" &&
    typeof value.tableNumber === "number" &&
    Array.isArray(value.results) &&
    value.results.every(isGameResult)
  );
}

function isOfficialResult(value: unknown): value is OfficialResult {
  return (
    isRecord(value) &&
    typeof value.playerId === "string" &&
    typeof value.mahjongPoint === "number" &&
    typeof value.mahjongRank === "number" &&
    Number.isInteger(value.mahjongRank) &&
    value.mahjongRank > 0 &&
    typeof value.subgamePoint === "number" &&
    typeof value.subgameRank === "number" &&
    Number.isInteger(value.subgameRank) &&
    value.subgameRank > 0
  );
}

function isSubgameResult(value: unknown): value is SubgameResult {
  return (
    isRecord(value) &&
    typeof value.roundNumber === "number" &&
    Number.isInteger(value.roundNumber) &&
    value.roundNumber > 0 &&
    typeof value.playerId === "string" &&
    typeof value.point === "number"
  );
}

export function isTournamentArchive(
  value: unknown,
): value is TournamentArchive {
  if (
    !(
      isRecord(value) &&
      value.schemaVersion === "0.2.0" &&
      isTournament(value.tournament) &&
      Array.isArray(value.players) &&
      value.players.every(isPlayer) &&
      Array.isArray(value.games) &&
      value.games.every(isMahjongGame) &&
      Array.isArray(value.subgameResults) &&
      value.subgameResults.every(isSubgameResult) &&
      (value.subgameDataStatus === "sample" ||
        value.subgameDataStatus === "official") &&
      Array.isArray(value.officialResults) &&
      value.officialResults.every(isOfficialResult)
    )
  ) {
    return false;
  }

  const playerIds = new Set(value.players.map((player) => player.playerId));
  const referencedPlayerIds = [
    ...value.games.flatMap((game) =>
      game.results.map((result) => result.playerId),
    ),
    ...value.subgameResults.map((result) => result.playerId),
    ...value.officialResults.map((result) => result.playerId),
  ];

  return (
    playerIds.size === value.players.length &&
    referencedPlayerIds.every((playerId) => playerIds.has(playerId))
  );
}

export function parseArchive(plaintext: Uint8Array): TournamentArchive {
  let value: unknown;

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    value = JSON.parse(text);
  } catch {
    throw new ArchiveDecryptionError();
  }

  if (!isTournamentArchive(value)) {
    throw new ArchiveDecryptionError();
  }

  return value;
}

export async function loadEncryptedArchive(
  url: string,
  password: string,
): Promise<TournamentArchive> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new ArchiveLoadError();
  }

  if (!response.ok) {
    throw new ArchiveLoadError();
  }

  let envelope: unknown;
  try {
    envelope = await response.json();
  } catch {
    throw new ArchiveDecryptionError();
  }

  const plaintext = await decryptArchive(envelope, password);
  return parseArchive(plaintext);
}

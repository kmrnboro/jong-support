import Ajv2020 from "ajv/dist/2020";

import archiveIndexSchema from "../../../../schemas/archive-index.schema.json";
import archiveSchema from "../../../../schemas/tournament-archive.schema.json";
import type { TournamentArchive } from "../domain/archive";
import { resolveScoringRule } from "../domain/scoring";
import type { ArchiveIndex } from "./archiveIndex";

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateArchiveSchema = ajv.compile<TournamentArchive>(archiveSchema);
const validateIndexSchema = ajv.compile<ArchiveIndex>(archiveIndexSchema);

function officialIds(
  archive: TournamentArchive,
  department: "mahjong" | "subgame",
): Set<string> {
  return new Set(
    archive.players
      .filter(
        (player) => player.rankingEligibility[department] === "official",
      )
      .map((player) => player.playerId),
  );
}

function sameSet(left: Set<string>, right: Set<string>): boolean {
  return (
    left.size === right.size && [...left].every((value) => right.has(value))
  );
}

function validOfficialResults(
  archive: TournamentArchive,
  department: "mahjong" | "subgame",
): boolean {
  const results =
    department === "mahjong"
      ? archive.mahjong.officialResults
      : archive.subgame?.officialResults;
  if (results === undefined) {
    return false;
  }
  const resultIds = results.map((result) => result.playerId);
  return (
    new Set(resultIds).size === resultIds.length &&
    sameSet(new Set(resultIds), officialIds(archive, department))
  );
}

function validReferences(archive: TournamentArchive): boolean {
  const playersById = new Map(
    archive.players.map((player) => [player.playerId, player]),
  );
  if (playersById.size !== archive.players.length) {
    return false;
  }

  const gameIds = archive.mahjong.games.map((game) => game.gameId);
  if (new Set(gameIds).size !== gameIds.length) {
    return false;
  }
  for (const game of archive.mahjong.games) {
    const resultIds = game.results.map((result) => result.playerId);
    if (
      new Set(resultIds).size !== resultIds.length ||
      resultIds.some((playerId) => {
        const player = playersById.get(playerId);
        return (
          player === undefined ||
          player.rankingEligibility.mahjong === "notParticipating"
        );
      })
    ) {
      return false;
    }
  }
  if (!validOfficialResults(archive, "mahjong")) {
    return false;
  }

  if (archive.subgame === null) {
    return archive.players.every(
      (player) =>
        player.rankingEligibility.subgame === "notParticipating",
    );
  }

  const roundPlayers = new Map<number, Set<string>>();
  for (const result of archive.subgame.results) {
    const player = playersById.get(result.playerId);
    if (
      player === undefined ||
      player.rankingEligibility.subgame === "notParticipating"
    ) {
      return false;
    }
    const players = roundPlayers.get(result.roundNumber) ?? new Set<string>();
    if (players.has(result.playerId)) {
      return false;
    }
    players.add(result.playerId);
    roundPlayers.set(result.roundNumber, players);
  }
  return validOfficialResults(archive, "subgame");
}

export function isTournamentArchive(
  value: unknown,
): value is TournamentArchive {
  if (!validateArchiveSchema(value) || !validReferences(value)) {
    return false;
  }
  try {
    resolveScoringRule(value.mahjong.scoring);
    if (value.subgame !== null) {
      resolveScoringRule(value.subgame.scoring);
    }
    return true;
  } catch {
    return false;
  }
}

export function isArchiveIndex(value: unknown): value is ArchiveIndex {
  if (!validateIndexSchema(value)) {
    return false;
  }
  const archiveIds = value.archives.map((entry) => entry.archiveId);
  const files = value.archives.map((entry) => entry.file);
  return (
    new Set(archiveIds).size === archiveIds.length &&
    new Set(files).size === files.length
  );
}

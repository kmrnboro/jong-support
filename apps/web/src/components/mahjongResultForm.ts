import {
  INITIAL_SEATS,
  type InitialSeat,
  type RawGameResult,
} from "../tournament/session";

export type EditableGameResult = {
  initialSeat: InitialSeat;
  playerId: string;
  rawScore: string;
};

export function createEmptyGameResults(): EditableGameResult[] {
  return INITIAL_SEATS.map((initialSeat) => ({
    initialSeat,
    playerId: "",
    rawScore: "",
  }));
}

export function parseGameResults(
  results: EditableGameResult[],
): RawGameResult[] {
  if (results.some((result) => result.playerId === "")) {
    throw new Error("東・南・西・北の参加者を選択してください。");
  }
  if (results.some((result) => result.rawScore.trim() === "")) {
    throw new Error("4名分の素点を入力してください。");
  }
  return results.map((result) => ({
    ...result,
    rawScore: Number(result.rawScore),
  }));
}

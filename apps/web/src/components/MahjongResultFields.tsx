import {
  calculatePrototypeResults,
  SEAT_LABELS,
  type InitialSeat,
  type TournamentPlayer,
} from "../tournament/session";
import type { EditableGameResult } from "./mahjongResultForm";

type MahjongResultFieldsProps = {
  idPrefix: string;
  players: TournamentPlayer[];
  results: EditableGameResult[];
  startingScore: number;
  disabled?: boolean;
  onChange: (results: EditableGameResult[]) => void;
};

export function MahjongResultFields({
  idPrefix,
  players,
  results,
  startingScore,
  disabled = false,
  onChange,
}: MahjongResultFieldsProps) {
  const scoreValues = results.map((result) => Number(result.rawScore));
  const allScoresEntered = results.every(
    (result) => result.rawScore.trim() !== "" && Number.isFinite(Number(result.rawScore)),
  );
  const hasInvalidScore = results.some(
    (result, index) =>
      result.rawScore.trim() !== "" && !Number.isFinite(scoreValues[index]),
  );
  const total = scoreValues.reduce(
    (sum, score) => sum + (Number.isFinite(score) ? score : 0),
    0,
  );
  const expectedTotal = startingScore * 4;
  const ranks = allScoresEntered
    ? new Map(
        calculatePrototypeResults(
          startingScore,
          results.map((result) => ({
            ...result,
            rawScore: Number(result.rawScore),
          })),
        ).map((result) => [result.initialSeat, result.rank]),
      )
    : new Map<InitialSeat, number>();

  function update(
    initialSeat: InitialSeat,
    field: "playerId" | "rawScore",
    value: string,
  ) {
    onChange(
      results.map((result) =>
        result.initialSeat === initialSeat
          ? { ...result, [field]: value }
          : result,
      ),
    );
  }

  return (
    <fieldset className="result-fields" disabled={disabled}>
      <legend>開始時の席順</legend>
      <div className="result-field-heading" aria-hidden="true">
        <span>席</span>
        <span>参加者</span>
        <span>素点</span>
        <span>着順</span>
      </div>
      {results.map((result) => {
        const playerId = `${idPrefix}-${result.initialSeat}-player`;
        const scoreId = `${idPrefix}-${result.initialSeat}-score`;
        return (
          <div className="result-field-row" key={result.initialSeat}>
            <strong className="seat-label">{SEAT_LABELS[result.initialSeat]}</strong>
            <label className="visually-hidden" htmlFor={playerId}>
              {SEAT_LABELS[result.initialSeat]}の参加者
            </label>
            <select
              id={playerId}
              value={result.playerId}
              onChange={(event) =>
                update(result.initialSeat, "playerId", event.target.value)
              }
            >
              <option value="">選択</option>
              {players.map((player) => (
                <option key={player.playerId} value={player.playerId}>
                  {player.nickname}
                </option>
              ))}
            </select>
            <label className="visually-hidden" htmlFor={scoreId}>
              {SEAT_LABELS[result.initialSeat]}の素点
            </label>
            <input
              id={scoreId}
              inputMode="numeric"
              placeholder="25000"
              type="text"
              value={result.rawScore}
              onChange={(event) =>
                update(result.initialSeat, "rawScore", event.target.value)
              }
            />
            <span className="calculated-rank">
              {ranks.get(result.initialSeat) ?? "—"}位
            </span>
          </div>
        );
      })}
      <p
        className={`score-total ${hasInvalidScore || (allScoresEntered && total !== expectedTotal) ? "score-total-error" : ""}`}
        aria-live="polite"
      >
        素点合計 <strong>{hasInvalidScore ? "—" : total.toLocaleString("ja-JP")}</strong> / 期待値{" "}
        {expectedTotal.toLocaleString("ja-JP")}点（持ち点
        {startingScore.toLocaleString("ja-JP")}点 × 4）
      </p>
    </fieldset>
  );
}

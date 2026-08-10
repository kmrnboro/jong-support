import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  MahjongResultFields,
  TournamentResultSummary,
  ValidationDialog,
} from "../components/MahjongResultFields";
import {
  parseGameResults,
  type EditableGameResult,
} from "../components/mahjongResultForm";
import {
  calculatePrototypeResults,
  correctGame,
  INITIAL_SEATS,
  SEAT_LABELS,
  type CorrectionInput,
  type TournamentSession,
} from "../tournament/session";
import { NotFoundPage } from "./NotFoundPage";

type MahjongResultEditPageProps = {
  session: TournamentSession;
  onCorrect: (gameId: string, input: CorrectionInput) => void;
};

export function MahjongResultEditPage({
  session,
  onCorrect,
}: MahjongResultEditPageProps) {
  const navigate = useNavigate();
  const { gameId = "" } = useParams();
  const game = session.games.find((candidate) => candidate.gameId === gameId);
  const [roundNumber, setRoundNumber] = useState(() => String(game?.roundNumber ?? 1));
  const [tableNumber, setTableNumber] = useState(() => String(game?.tableNumber ?? 1));
  const [reason, setReason] = useState("");
  const [results, setResults] = useState<EditableGameResult[]>(() =>
    INITIAL_SEATS.map((initialSeat) => {
      const result = game?.results.find((candidate) => candidate.initialSeat === initialSeat);
      return {
        initialSeat,
        playerId: result?.playerId ?? "",
        rawScore: result === undefined ? "" : String(result.rawScore),
      };
    }),
  );
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (game === undefined) {
    return <NotFoundPage />;
  }

  function buildInput(): CorrectionInput {
    return {
      roundNumber: Number(roundNumber),
      tableNumber: Number(tableNumber),
      reason,
      results: parseGameResults(results),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const input = buildInput();
      correctGame(session, gameId, input);
      if (!confirming) {
        setConfirming(true);
        return;
      }
      onCorrect(gameId, input);
      navigate("/prototype/tournament", {
        replace: true,
      });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "結果を訂正できませんでした。");
      setConfirming(false);
    }
  }

  const playerNames = new Map(
    session.players.map((player) => [player.playerId, player.nickname]),
  );
  const correctedResults = confirming
    ? calculatePrototypeResults(
        session.tournament.startingScore,
        parseGameResults(results),
      )
    : [];

  return (
    <section className="page-stack tournament-mode narrow-page">
      <header>
        <Link className="text-link text-link-top" to="/prototype/tournament">
          ← ダッシュボードへ
        </Link>
        <p className="eyebrow">RESULT CORRECTION</p>
        <h1>{confirming ? "訂正内容を確認" : "対局結果を訂正"}</h1>
      </header>

      {!confirming ? (
        <article className="current-result">
          <h2>現在の登録（revision {game.revision}）</h2>
          <div className="current-result-grid">
            {INITIAL_SEATS.map((seat) => {
              const result = game.results.find(
                (candidate) => candidate.initialSeat === seat,
              );
              return (
                <span key={seat}>
                  <strong>{SEAT_LABELS[seat]}</strong>{" "}
                  {result ? playerNames.get(result.playerId) : "—"}{" "}
                  {result?.rawScore.toLocaleString("ja-JP")}点
                </span>
              );
            })}
          </div>
        </article>
      ) : null}

      <form className="tournament-form" onSubmit={handleSubmit}>
        <div className="round-fields">
          <label>
            回番号
            <input disabled={confirming} min="1" type="number" value={roundNumber} onChange={(event) => setRoundNumber(event.target.value)} />
          </label>
          <label>
            卓番号
            <input disabled={confirming} min="1" type="number" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} />
          </label>
        </div>

        {confirming ? (
          <div className="correction-comparison">
            <TournamentResultSummary
              players={session.players}
              results={game.results}
              title={`訂正前（revision ${game.revision}）`}
            />
            <TournamentResultSummary
              players={session.players}
              results={correctedResults}
              title={`訂正後（revision ${game.revision + 1}）`}
            />
          </div>
        ) : (
          <MahjongResultFields
            idPrefix="correct"
            players={session.players}
            results={results}
            startingScore={session.tournament.startingScore}
            onChange={setResults}
          />
        )}

        <label className="reason-field">
          訂正理由
          <textarea
            disabled={confirming}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        {confirming ? <p className="confirmation-note">変更前後と訂正理由を確認してください。元の記録は履歴に残ります。</p> : null}
        <div className="form-actions">
          {confirming ? (
            <button className="secondary-button" type="button" onClick={() => setConfirming(false)}>
              入力へ戻る
            </button>
          ) : null}
          <button className="primary-button" type="submit">
            {confirming ? "この内容で訂正" : "訂正内容を確認"}
          </button>
        </div>
      </form>
      {error ? (
        <ValidationDialog message={error} onClose={() => setError(null)} />
      ) : null}
    </section>
  );
}

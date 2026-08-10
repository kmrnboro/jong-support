import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  MahjongResultFields,
  TournamentResultSummary,
  ValidationDialog,
} from "../components/MahjongResultFields";
import {
  createEmptyGameResults,
  parseGameResults,
  type EditableGameResult,
} from "../components/mahjongResultForm";
import {
  calculatePrototypeResults,
  registerGame,
  type GameInput,
  type TournamentSession,
} from "../tournament/session";

type MahjongResultInputPageProps = {
  session: TournamentSession;
  onRegister: (input: GameInput) => void;
};

export function MahjongResultInputPage({
  session,
  onRegister,
}: MahjongResultInputPageProps) {
  const navigate = useNavigate();
  const [roundNumber, setRoundNumber] = useState("1");
  const [tableNumber, setTableNumber] = useState("1");
  const [results, setResults] = useState<EditableGameResult[]>(
    createEmptyGameResults,
  );
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildInput(): GameInput {
    return {
      roundNumber: Number(roundNumber),
      tableNumber: Number(tableNumber),
      results: parseGameResults(results),
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const input = buildInput();
      registerGame(session, input);
      if (!confirming) {
        setConfirming(true);
        return;
      }
      onRegister(input);
      navigate("/prototype/tournament", {
        replace: true,
      });
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "結果を登録できませんでした。");
      setConfirming(false);
    }
  }

  const confirmationResults = confirming
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
        <p className="eyebrow">MAHJONG RESULT</p>
        <h1>{confirming ? "登録内容を確認" : "対局結果を入力"}</h1>
      </header>

      <p className="prototype-notice">
        仮ptは操作確認用です。正式なウマ・オカ計算ではありません。
      </p>

      <form className="tournament-form" onSubmit={handleSubmit}>
        <div className="round-fields">
          <label>
            回番号
            <input
              disabled={confirming}
              inputMode="numeric"
              min="1"
              type="number"
              value={roundNumber}
              onChange={(event) => setRoundNumber(event.target.value)}
            />
          </label>
          <label>
            卓番号
            <input
              disabled={confirming}
              inputMode="numeric"
              min="1"
              type="number"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
            />
          </label>
        </div>

        {confirming ? (
          <TournamentResultSummary
            players={session.players}
            results={confirmationResults}
            title="最終着順と素点"
          />
        ) : (
          <MahjongResultFields
            idPrefix="register"
            players={session.players}
            results={results}
            startingScore={session.tournament.startingScore}
            onChange={setResults}
          />
        )}

        {confirming ? (
          <p className="confirmation-note">
            回・卓、参加者、素点を読み合わせてから登録してください。
          </p>
        ) : null}
        <div className="form-actions">
          {confirming ? (
            <button className="secondary-button" type="button" onClick={() => setConfirming(false)}>
              入力へ戻る
            </button>
          ) : null}
          <button className="primary-button" type="submit">
            {confirming ? "この内容で登録" : "入力内容を確認"}
          </button>
        </div>
      </form>
      {error ? (
        <ValidationDialog message={error} onClose={() => setError(null)} />
      ) : null}
    </section>
  );
}

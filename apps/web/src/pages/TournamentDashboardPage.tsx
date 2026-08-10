import { Link } from "react-router-dom";

import {
  createLiveRanking,
  type TournamentSession,
} from "../tournament/session";

type TournamentDashboardPageProps = {
  session: TournamentSession;
  message: string | null;
  onStart: () => void;
  onClose: () => void;
  onResume: () => void;
};

const statusLabels = {
  preparing: "開始前",
  active: "開催中",
  closed: "入力終了",
} as const;

function formatPoint(point: number) {
  return `${point > 0 ? "+" : ""}${point.toFixed(1)}`;
}

export function TournamentDashboardPage({
  session,
  message,
  onStart,
  onClose,
  onResume,
}: TournamentDashboardPageProps) {
  const ranking = createLiveRanking(session);
  const playerNames = new Map(
    session.players.map((player) => [player.playerId, player.nickname]),
  );
  const recentGames = [...session.games].reverse();

  return (
    <section className="page-stack tournament-mode">
      <header className="page-heading tournament-heading">
        <div>
          <p className="eyebrow">TOURNAMENT PROTOTYPE</p>
          <h1>{session.tournament.name}</h1>
          <p className="page-summary">
            状態: {statusLabels[session.tournament.status]} ・ 登録済み
            {session.games.length}対局
          </p>
        </div>
        <div className="page-actions tournament-actions">
          <Link className="text-link" to="/prototype/tournament/progress">
            素点推移を見る
          </Link>
          {session.tournament.status === "active" ? (
            <Link className="primary-link" to="/prototype/tournament/input">
              結果を入力
            </Link>
          ) : null}
        </div>
      </header>

      {message ? <p className="success-message" role="status">{message}</p> : null}

      <p className="prototype-notice">
        この画面はブラウザメモリだけで動く操作確認用です。再読み込みすると初期化されます。
        表示ptは正式な大会得点ではありません。
      </p>

      <article className="content-card tournament-admin-card">
        <div>
          <p className="card-label">ORGANIZER CONTROL</p>
          <h2>運営操作</h2>
          <p>
            入力状態の変更は運営画面だけに置きます。プロトタイプでは認証を省略しています。
          </p>
        </div>
        {session.tournament.status === "preparing" ? (
          <button className="primary-button" type="button" onClick={onStart}>
            大会を開始
          </button>
        ) : null}
        {session.tournament.status === "active" ? (
          <button className="secondary-button" type="button" onClick={onClose}>
            入力を終了
          </button>
        ) : null}
        {session.tournament.status === "closed" ? (
          <button className="primary-button" type="button" onClick={onResume}>
            入力を再開
          </button>
        ) : null}
      </article>

      <article className="ranking-card">
        <div className="section-heading">
          <div>
            <p className="card-label">LIVE RANKING</p>
            <h2>暫定順位</h2>
          </div>
          <p>素点と持ち点の差を千点単位で表示するサンプル計算です。</p>
        </div>
        <div className="table-scroll" tabIndex={0}>
          <table className="ranking-table tournament-ranking">
            <thead>
              <tr>
                <th>順位</th>
                <th>参加者</th>
                <th>対局数</th>
                <th>仮pt</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={4}>対局登録後に暫定順位を表示します。</td>
                </tr>
              ) : (
                ranking.map((row) => (
                  <tr key={row.playerId}>
                    <td><span className="rank-number">{row.rank}</span></td>
                    <th scope="row">{row.nickname}</th>
                    <td>{row.gameCount}</td>
                    <td className="point-total">{formatPoint(row.totalPoint)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="content-card tournament-list-card">
        <div className="section-heading compact-heading">
          <div>
            <p className="card-label">RECENT GAMES</p>
            <h2>登録済み対局</h2>
          </div>
        </div>
        {recentGames.length === 0 ? (
          <p>まだ対局結果は登録されていません。</p>
        ) : (
          <div className="game-list">
            {recentGames.map((game) => {
              const winner = [...game.results].sort((a, b) => a.rank - b.rank)[0];
              return (
                <div className="game-list-row" key={game.gameId}>
                  <div>
                    <strong>{game.roundNumber}回戦・{game.tableNumber}卓</strong>
                    <span>
                      1位 {winner ? playerNames.get(winner.playerId) : "—"} / revision {game.revision}
                    </span>
                  </div>
                  <Link className="text-link" to={`/prototype/tournament/games/${game.gameId}/edit`}>
                    訂正
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {session.corrections.length > 0 ? (
        <article className="content-card tournament-list-card">
          <p className="card-label">CORRECTION HISTORY</p>
          <h2>訂正履歴</h2>
          <ul className="correction-list">
            {[...session.corrections].reverse().map((correction) => (
              <li key={correction.correctionId}>
                {correction.after.roundNumber}回戦・{correction.after.tableNumber}卓
                （revision {correction.after.revision}）: {correction.reason}
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}

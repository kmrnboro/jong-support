import { Link, useParams } from "react-router-dom";

import { buildArchivePath } from "../archive/routes";
import type { TournamentArchive } from "../domain/archive";
import { calculatePlayerStatistics } from "../domain/statistics";

type PlayerPageProps = {
  archive: TournamentArchive;
};

const pointFormatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const percentFormatter = new Intl.NumberFormat("ja-JP", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function PlayerPage({ archive }: PlayerPageProps) {
  const { playerId = "" } = useParams();
  const player = archive.players.find((item) => item.playerId === playerId);
  const officialResult = archive.officialResults.find(
    (result) => result.playerId === playerId,
  );

  if (player === undefined || officialResult === undefined) {
    return (
      <section className="message-card">
        <p className="eyebrow">NOT FOUND</p>
        <h1>プレイヤーが見つかりません</h1>
        <Link
          className="text-link"
          to={buildArchivePath(archive.tournament.id)}
        >
          最終順位へ戻る
        </Link>
      </section>
    );
  }

  const statistics = calculatePlayerStatistics(playerId, archive.games);

  return (
    <div className="page-stack">
      <header className="player-heading">
        <div>
          <p className="eyebrow">PLAYER RESULT</p>
          <h1>{player.nickname}</h1>
          <p className="player-id">Player ID: {player.playerId}</p>
        </div>
        <div className="official-rank" aria-label={`公式順位 ${officialResult.rank}位`}>
          <span>公式順位</span>
          <strong>{officialResult.rank}</strong>
          <small>位</small>
        </div>
      </header>

      <section className="point-summary" aria-labelledby="point-summary-title">
        <div className="section-heading compact-heading">
          <div>
            <p className="card-label">OFFICIAL POINTS</p>
            <h2 id="point-summary-title">確定ポイント</h2>
          </div>
        </div>
        <dl className="point-grid">
          <div className="point-grid-total">
            <dt>総合pt</dt>
            <dd>{pointFormatter.format(officialResult.totalPoint)}</dd>
          </div>
          <div>
            <dt>麻雀pt</dt>
            <dd>{pointFormatter.format(officialResult.mahjongPoint)}</dd>
          </div>
          <div>
            <dt>サブゲームpt</dt>
            <dd>{pointFormatter.format(officialResult.subgamePoint)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="statistics-title">
        <div className="section-heading compact-heading">
          <div>
            <p className="card-label">GAME STATISTICS</p>
            <h2 id="statistics-title">個人成績</h2>
          </div>
        </div>
        <dl className="statistics-grid">
          <div>
            <dt>対局数</dt>
            <dd>{statistics.gameCount}<small>半荘</small></dd>
          </div>
          <div>
            <dt>平均順位</dt>
            <dd>
              {statistics.averageRank === null
                ? "—"
                : statistics.averageRank.toFixed(2)}
              {statistics.averageRank === null ? null : <small>位</small>}
            </dd>
          </div>
          <div>
            <dt>トップ率</dt>
            <dd>
              {statistics.topRate === null
                ? "—"
                : percentFormatter.format(statistics.topRate)}
            </dd>
          </div>
          <div>
            <dt>ラス率</dt>
            <dd>
              {statistics.lastRate === null
                ? "—"
                : percentFormatter.format(statistics.lastRate)}
            </dd>
          </div>
        </dl>
      </section>

      <Link
        className="text-link"
        to={buildArchivePath(archive.tournament.id)}
      >
        最終順位へ戻る
      </Link>
    </div>
  );
}

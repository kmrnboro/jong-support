import { useState } from "react";
import { Link } from "react-router-dom";

import { POINT_SERIES_COLORS } from "../components/chartColors";
import { PointProgressChart } from "../components/PointProgressChart";
import {
  createRawScoreProgressions,
  type TournamentSession,
} from "../tournament/session";

type TournamentProgressPageProps = {
  session: TournamentSession;
};

export function TournamentProgressPage({
  session,
}: TournamentProgressPageProps) {
  const progressions = createRawScoreProgressions(session);
  const [visiblePlayerIds, setVisiblePlayerIds] = useState(
    () => new Set(progressions.map((player) => player.playerId)),
  );
  const colorByPlayerId = new Map(
    progressions.map((player, index) => [
      player.playerId,
      POINT_SERIES_COLORS[index % POINT_SERIES_COLORS.length],
    ]),
  );

  function togglePlayer(playerId: string) {
    setVisiblePlayerIds((current) => {
      const next = new Set(current);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  return (
    <section className="page-stack tournament-mode">
      <header className="page-heading tournament-heading">
        <div>
          <p className="eyebrow">RAW SCORE PROGRESSION</p>
          <h1>素点推移</h1>
          <p className="page-summary">
            登録済み対局ごとの素点を参加者間で比較します。
          </p>
        </div>
        <Link className="text-link text-link-top" to="/prototype/tournament">
          ダッシュボードへ戻る
        </Link>
      </header>

      <section className="player-filter" aria-labelledby="live-player-filter">
        <div className="filter-heading">
          <h2 id="live-player-filter">表示する参加者</h2>
          <div>
            <button
              type="button"
              onClick={() =>
                setVisiblePlayerIds(
                  new Set(progressions.map((player) => player.playerId)),
                )
              }
            >
              全員表示
            </button>
            <button type="button" onClick={() => setVisiblePlayerIds(new Set())}>
              すべて解除
            </button>
          </div>
        </div>
        <div className="player-options">
          {progressions.map((player, index) => (
            <label key={player.playerId}>
              <input
                checked={visiblePlayerIds.has(player.playerId)}
                onChange={() => togglePlayer(player.playerId)}
                type="checkbox"
              />
              <span
                aria-hidden="true"
                className="series-color"
                style={{
                  backgroundColor:
                    POINT_SERIES_COLORS[index % POINT_SERIES_COLORS.length],
                }}
              />
              {player.nickname}
            </label>
          ))}
        </div>
      </section>

      <section className="content-card chart-card" aria-labelledby="raw-chart-title">
        <div className="section-heading compact-heading">
          <div>
            <p className="card-label">MAHJONG RAW SCORE</p>
            <h2 id="raw-chart-title">回別素点</h2>
          </div>
        </div>
        <PointProgressChart
          colorByPlayerId={colorByPlayerId}
          includeZero={false}
          label="素点"
          series={progressions}
          visiblePlayerIds={visiblePlayerIds}
        />
      </section>
    </section>
  );
}

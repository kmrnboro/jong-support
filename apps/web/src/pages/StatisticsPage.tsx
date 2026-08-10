import { useState } from "react";
import { Link } from "react-router-dom";

import { buildArchivePath } from "../archive/routes";
import { POINT_SERIES_COLORS } from "../components/chartColors";
import { PointProgressChart } from "../components/PointProgressChart";
import type { TournamentArchive } from "../domain/archive";
import {
  calculateMahjongProgressions,
  calculatePlayerStatistics,
  calculateSubgameProgressions,
} from "../domain/statistics";

type StatisticsPageProps = {
  archive: TournamentArchive;
};

const percentFormatter = new Intl.NumberFormat("ja-JP", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function StatisticsPage({ archive }: StatisticsPageProps) {
  const [visiblePlayerIds, setVisiblePlayerIds] = useState(
    () => new Set(archive.players.map((player) => player.playerId)),
  );

  const mahjongProgressions = calculateMahjongProgressions(
    archive.players,
    archive.mahjong.games,
  );
  const subgameProgressions =
    archive.subgame === null
      ? null
      : calculateSubgameProgressions(
          archive.players,
          archive.subgame.results,
        );
  const colorByPlayerId = new Map(
    archive.players.map((player, index) => [
      player.playerId,
      POINT_SERIES_COLORS[index % POINT_SERIES_COLORS.length],
    ]),
  );
  const statistics = archive.players
    .map((player) => ({
      nickname: player.nickname,
      ...calculatePlayerStatistics(player.playerId, archive.mahjong.games),
    }))
    .filter((player) => player.gameCount > 0);

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
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">TOURNAMENT COMPARISON</p>
          <h1>{archive.tournament.name} 統計</h1>
          <p className="page-summary">全参加者の成績とpt推移を比較できます。</p>
        </div>
        <Link
          className="text-link text-link-top"
          to={buildArchivePath(archive.tournament.id)}
        >
          公式順位へ戻る
        </Link>
      </header>

      <section className="player-filter" aria-labelledby="player-filter-title">
        <div className="filter-heading">
          <h2 id="player-filter-title">表示するプレイヤー</h2>
          <div>
            <button
              type="button"
              onClick={() =>
                setVisiblePlayerIds(
                  new Set(archive.players.map((player) => player.playerId)),
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
          {archive.players.map((player, index) => (
            <label key={player.playerId}>
              <input
                type="checkbox"
                checked={visiblePlayerIds.has(player.playerId)}
                onChange={() => togglePlayer(player.playerId)}
              />
              <span
                className="series-color"
                style={{
                  backgroundColor:
                    POINT_SERIES_COLORS[index % POINT_SERIES_COLORS.length],
                }}
                aria-hidden="true"
              />
              {player.nickname}
            </label>
          ))}
        </div>
      </section>

      <section
        className="content-card chart-card"
        aria-labelledby="mahjong-chart-title"
      >
        <div className="section-heading compact-heading">
          <div>
            <p className="card-label">MAHJONG PROGRESSION</p>
            <h2 id="mahjong-chart-title">麻雀pt推移</h2>
          </div>
        </div>
        <PointProgressChart
          label="麻雀pt"
          series={mahjongProgressions}
          visiblePlayerIds={visiblePlayerIds}
          colorByPlayerId={colorByPlayerId}
        />
      </section>

      {subgameProgressions === null ? null : (
        <section
          className="content-card chart-card"
          aria-labelledby="subgame-chart-title"
        >
          <div className="section-heading compact-heading">
            <div>
              <p className="card-label">SUBGAME PROGRESSION</p>
              <h2 id="subgame-chart-title">
                サブゲームpt推移
                {archive.subgame?.dataStatus === "sample" ? "（仮）" : ""}
              </h2>
            </div>
          </div>
          {archive.subgame?.dataStatus === "sample" ? (
            <p className="sample-note">
              画面確認用の仮データを使用しています。
            </p>
          ) : null}
          <PointProgressChart
            label="サブゲームpt"
            series={subgameProgressions}
            visiblePlayerIds={visiblePlayerIds}
            colorByPlayerId={colorByPlayerId}
          />
        </section>
      )}

      <section className="ranking-card" aria-labelledby="comparison-title">
        <div className="section-heading">
          <div>
            <p className="card-label">MAHJONG STATISTICS</p>
            <h2 id="comparison-title">麻雀成績比較</h2>
          </div>
        </div>
        <div className="table-scroll" tabIndex={0}>
          <table className="comparison-table">
            <caption className="visually-hidden">
              全参加者の対局数、平均順位、トップ率、ラス率
            </caption>
            <thead>
              <tr>
                <th scope="col">プレイヤー</th>
                <th scope="col">対局数</th>
                <th scope="col">平均順位</th>
                <th scope="col">トップ率</th>
                <th scope="col">ラス率</th>
              </tr>
            </thead>
            <tbody>
              {statistics.map((row) => (
                <tr key={row.playerId}>
                  <th scope="row">{row.nickname}</th>
                  <td>{row.gameCount}</td>
                  <td>{row.averageRank?.toFixed(2) ?? "—"}</td>
                  <td>
                    {row.topRate === null
                      ? "—"
                      : percentFormatter.format(row.topRate)}
                  </td>
                  <td>
                    {row.lastRate === null
                      ? "—"
                      : percentFormatter.format(row.lastRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

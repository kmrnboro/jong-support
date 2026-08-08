import { Link } from "react-router-dom";

import {
  calculateCrossYearStatistics,
  type ArchiveStatisticsSummary,
} from "../domain/statistics";

type CrossYearStatisticsPageProps = {
  summaries: readonly ArchiveStatisticsSummary[];
};

const percentFormatter = new Intl.NumberFormat("ja-JP", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function CrossYearStatisticsPage({
  summaries,
}: CrossYearStatisticsPageProps) {
  const statistics = calculateCrossYearStatistics(summaries);

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">CROSS-YEAR STATISTICS</p>
          <h1>年度横断統計</h1>
          <p className="page-summary">集計済み{summaries.length}大会</p>
        </div>
        <Link className="text-link text-link-top" to="/">
          大会トップへ戻る
        </Link>
      </header>

      <section className="content-card">
        <p>
          比較する大会をトップページから順に開いてください。復号したArchive本体は
          現在表示中の1大会だけを保持し、年度横断画面には集計値だけをメモリ内で渡します。
          ページを再読み込みすると集計対象はリセットされます。
        </p>
      </section>

      {statistics.length === 0 ? (
        <section className="message-card">
          <h2>集計対象の大会がありません</h2>
          <p>大会トップからArchiveを1件以上開いてください。</p>
        </section>
      ) : (
        <section className="ranking-card" aria-labelledby="cross-year-title">
          <div className="section-heading">
            <div>
              <p className="card-label">PLAYER COMPARISON</p>
              <h2 id="cross-year-title">通算成績比較</h2>
            </div>
          </div>
          <div className="table-scroll" tabIndex={0}>
            <table className="cross-year-table">
              <caption className="visually-hidden">
                複数年度にわたる参加者の麻雀成績と部門別優勝回数
              </caption>
              <thead>
                <tr>
                  <th scope="col">プレイヤー</th>
                  <th scope="col">大会数</th>
                  <th scope="col">対局数</th>
                  <th scope="col">平均順位</th>
                  <th scope="col">トップ率</th>
                  <th scope="col">ラス率</th>
                  <th scope="col">麻雀優勝</th>
                  <th scope="col">サブゲーム優勝</th>
                </tr>
              </thead>
              <tbody>
                {statistics.map((player) => (
                  <tr key={player.playerId}>
                    <th scope="row">{player.nickname}</th>
                    <td>{player.tournamentCount}</td>
                    <td>{player.gameCount}</td>
                    <td>{player.averageRank?.toFixed(2) ?? "—"}</td>
                    <td>
                      {player.topRate === null
                        ? "—"
                        : percentFormatter.format(player.topRate)}
                    </td>
                    <td>
                      {player.lastRate === null
                        ? "—"
                        : percentFormatter.format(player.lastRate)}
                    </td>
                    <td>{player.mahjongChampionships}回</td>
                    <td>{player.subgameChampionships}回</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

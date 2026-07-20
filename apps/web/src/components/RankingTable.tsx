import { Link } from "react-router-dom";

import { buildPlayerPath } from "../archive/routes";
import type { OfficialRankingRow } from "../domain/ranking";

type RankingTableProps = {
  rows: OfficialRankingRow[];
};

const pointFormatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export function RankingTable({ rows }: RankingTableProps) {
  return (
    <div className="table-scroll" tabIndex={0}>
      <table className="ranking-table">
        <caption className="visually-hidden">
          公式順位、総合ポイント、麻雀ポイント、サブゲームポイント
        </caption>
        <thead>
          <tr>
            <th scope="col">順位</th>
            <th scope="col">プレイヤー</th>
            <th scope="col">総合pt</th>
            <th scope="col">麻雀pt</th>
            <th scope="col">サブpt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td>
                <span className="rank-number">{row.rank}</span>
              </td>
              <th scope="row">
                <Link to={buildPlayerPath(row.playerId)}>{row.nickname}</Link>
              </th>
              <td className="point-value point-total">
                {pointFormatter.format(row.totalPoint)}
              </td>
              <td className="point-value">
                {pointFormatter.format(row.mahjongPoint)}
              </td>
              <td className="point-value">
                {pointFormatter.format(row.subgamePoint)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

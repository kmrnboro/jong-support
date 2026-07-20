import type { OfficialRankingRow } from "../domain/ranking";

type RankingTableProps = {
  rows: OfficialRankingRow[];
  label: string;
};

const pointFormatter = new Intl.NumberFormat("ja-JP", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export function RankingTable({ rows, label }: RankingTableProps) {
  return (
    <div className="table-scroll" tabIndex={0}>
      <table className="ranking-table">
        <caption className="visually-hidden">{label}の公式順位とポイント</caption>
        <thead>
          <tr>
            <th scope="col">順位</th>
            <th scope="col">プレイヤー</th>
            <th scope="col">pt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.playerId}>
              <td>
                <span className="rank-number">{row.rank}</span>
              </td>
              <th scope="row">{row.nickname}</th>
              <td className="point-value">{pointFormatter.format(row.point)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

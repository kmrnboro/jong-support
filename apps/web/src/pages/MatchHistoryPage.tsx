import { Link } from "react-router-dom";

import { buildArchivePath } from "../archive/routes";
import type { TournamentArchive } from "../domain/archive";

type MatchHistoryPageProps = {
  archive: TournamentArchive;
};

const scoreFormatter = new Intl.NumberFormat("ja-JP");

function formatPoint(point: number): string {
  return `${point > 0 ? "+" : ""}${point}`;
}

export function MatchHistoryPage({ archive }: MatchHistoryPageProps) {
  const players = new Map(
    archive.players.map((player) => [player.playerId, player]),
  );
  const games = [...archive.mahjong.games].sort(
    (left, right) =>
      left.roundNumber - right.roundNumber ||
      left.tableNumber - right.tableNumber,
  );

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">MATCH HISTORY</p>
          <h1>{archive.tournament.name} 対局履歴</h1>
          <p className="page-summary">全{games.length}対局</p>
        </div>
        <Link
          className="text-link text-link-top"
          to={buildArchivePath(archive.tournament.id)}
        >
          公式順位へ戻る
        </Link>
      </header>

      <div className="match-list">
        {games.map((game) => (
          <section className="ranking-card" key={game.gameId}>
            <div className="section-heading match-heading">
              <div>
                <p className="card-label">{game.gameId}</p>
                <h2>
                  {game.roundNumber}回戦・{game.tableNumber}卓
                </h2>
              </div>
            </div>
            <div className="table-scroll" tabIndex={0}>
              <table className="match-table">
                <caption className="visually-hidden">
                  {game.roundNumber}回戦{game.tableNumber}卓の対局結果
                </caption>
                <thead>
                  <tr>
                    <th scope="col">順位</th>
                    <th scope="col">プレイヤー</th>
                    <th scope="col">素点</th>
                    <th scope="col">pt</th>
                  </tr>
                </thead>
                <tbody>
                  {[...game.results]
                    .sort((left, right) => left.rank - right.rank)
                    .map((result) => {
                      const player = players.get(result.playerId);
                      return (
                        <tr key={result.playerId}>
                          <td>{result.rank}</td>
                          <th scope="row">
                            {player?.nickname ?? result.playerId}
                            {player?.rankingEligibility.mahjong ===
                            "reference" ? (
                              <span className="reference-badge">参考</span>
                            ) : null}
                          </th>
                          <td>{scoreFormatter.format(result.rawScore)}</td>
                          <td>{formatPoint(result.finalPoint)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

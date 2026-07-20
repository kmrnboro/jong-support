import { Link, useParams } from "react-router-dom";

import { buildStatisticsPath } from "../archive/routes";
import { createOfficialRanking } from "../domain/ranking";
import type { TournamentArchive } from "../domain/archive";
import { RankingTable } from "../components/RankingTable";

type ArchivePageProps = {
  archive: TournamentArchive;
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function ArchivePage({ archive }: ArchivePageProps) {
  const { archiveId = "" } = useParams();

  if (archiveId !== archive.tournament.id) {
    return (
      <section className="message-card">
        <p className="eyebrow">NOT FOUND</p>
        <h1>大会が見つかりません</h1>
        <Link className="text-link" to="/">
          大会トップへ戻る
        </Link>
      </section>
    );
  }

  const mahjongRanking = createOfficialRanking(archive, "mahjong");
  const subgameRanking = createOfficialRanking(archive, "subgame");

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">OFFICIAL RESULTS</p>
          <h1 id="archive-title">{archive.tournament.name}</h1>
          <p className="page-summary">
            <time dateTime={archive.tournament.date}>
              {dateFormatter.format(new Date(archive.tournament.date))}
            </time>
            <span aria-hidden="true">・</span>
            {archive.players.length}名
          </p>
        </div>
        <div className="page-actions">
          <Link
            className="primary-link"
            to={buildStatisticsPath(archive.tournament.id)}
          >
            比較統計を見る
          </Link>
          <Link className="text-link" to="/">
            大会トップへ
          </Link>
        </div>
      </header>

      <div className="ranking-grid">
        <section className="ranking-card" aria-labelledby="mahjong-ranking-title">
          <div className="section-heading">
            <div>
              <p className="card-label">MAHJONG</p>
              <h2 id="mahjong-ranking-title">麻雀順位</h2>
            </div>
          </div>
          <RankingTable rows={mahjongRanking} label="麻雀" />
        </section>

        <section className="ranking-card" aria-labelledby="subgame-ranking-title">
          <div className="section-heading">
            <div>
              <p className="card-label">SUBGAME</p>
              <h2 id="subgame-ranking-title">
                サブゲーム順位
                {archive.subgameDataStatus === "sample" ? "（仮）" : ""}
              </h2>
            </div>
          </div>
          <RankingTable rows={subgameRanking} label="サブゲーム" />
        </section>
      </div>

      {archive.subgameDataStatus === "sample" ? (
        <p className="sample-note">
          サブゲームは画面確認用の仮データです。実データ受領後に差し替えます。
        </p>
      ) : null}
    </div>
  );
}

import { Link, useParams } from "react-router-dom";

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

  const ranking = createOfficialRanking(archive);

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">FINAL RANKING</p>
          <h1 id="archive-title">{archive.tournament.name}</h1>
          <p className="page-summary">
            <time dateTime={archive.tournament.date}>
              {dateFormatter.format(new Date(archive.tournament.date))}
            </time>
            <span aria-hidden="true">・</span>
            {archive.players.length}名
          </p>
        </div>
        <Link className="text-link text-link-top" to="/">
          大会トップへ
        </Link>
      </header>

      <section className="ranking-card" aria-labelledby="ranking-title">
        <div className="section-heading">
          <div>
            <p className="card-label">OFFICIAL RESULTS</p>
            <h2 id="ranking-title">最終順位</h2>
          </div>
          <p>プレイヤー名を選ぶと個人成績を確認できます。</p>
        </div>
        <RankingTable rows={ranking} />
      </section>
    </div>
  );
}

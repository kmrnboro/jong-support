import { Link } from "react-router-dom";

import type { ArchiveIndexEntry } from "../archive/archiveIndex";
import { buildArchivePath } from "../archive/routes";

type HomePageProps = {
  entries: ArchiveIndexEntry[];
};

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function HomePage({ entries }: HomePageProps) {
  return (
    <section className="hero" aria-labelledby="page-title">
      <p className="eyebrow">READ-ONLY ARCHIVE</p>
      <h1 id="page-title">大会の記録を、いつでも振り返る。</h1>
      <p className="lead">
        jong-supportは、麻雀大会の確定結果をGitHub Pagesで閲覧するための
        Archive Viewerです。
      </p>

      {entries.map((entry) => (
        <article className="tournament-card" key={entry.archiveId}>
          <div>
            <p className="card-label">AVAILABLE ARCHIVE</p>
            <h2>{entry.title}</h2>
            <dl className="tournament-meta">
              <div>
                <dt>開催日</dt>
                <dd>
                  <time dateTime={entry.date}>
                    {dateFormatter.format(new Date(entry.date))}
                  </time>
                </dd>
              </div>
              <div>
                <dt>参加者</dt>
                <dd>{entry.playerCount}名</dd>
              </div>
              <div>
                <dt>対局</dt>
                <dd>{entry.gameCount}半荘</dd>
              </div>
              <div>
                <dt>サブゲーム</dt>
                <dd>{entry.hasSubgame ? "あり" : "なし"}</dd>
              </div>
            </dl>
          </div>
          <Link
            className="primary-link"
            to={buildArchivePath(entry.archiveId)}
          >
            パスワードを入力
          </Link>
        </article>
      ))}
    </section>
  );
}

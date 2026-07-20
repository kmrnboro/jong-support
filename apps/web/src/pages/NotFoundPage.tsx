import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="content-card" aria-labelledby="not-found-title">
      <p className="eyebrow">404</p>
      <h1 id="not-found-title">ページが見つかりません</h1>
      <p>URLを確認するか、大会一覧へ戻ってください。</p>
      <Link className="text-link" to="/">
        大会一覧へ戻る
      </Link>
    </section>
  );
}


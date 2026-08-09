import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isTournamentMode = location.pathname.startsWith("/prototype/tournament");

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to={isTournamentMode ? "/prototype/tournament" : "/"}>
          <span className="brand-mark" aria-hidden="true">
            雀
          </span>
          <span>
            <strong>jong-support</strong>
            <small>{isTournamentMode ? "Tournament Prototype" : "Archive Viewer"}</small>
          </span>
        </Link>
      </header>

      <main className="page-container">{children}</main>

      <footer className="site-footer">
        {isTournamentMode
          ? "大会運営フローを確認するためのフロントエンド限定プロトタイプです。"
          : "過去大会を静的アーカイブから閲覧するためのWebアプリです。"}
      </footer>
    </div>
  );
}

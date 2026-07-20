import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            雀
          </span>
          <span>
            <strong>jong-support</strong>
            <small>Archive Viewer</small>
          </span>
        </Link>
      </header>

      <main className="page-container">{children}</main>

      <footer className="site-footer">
        過去大会を静的アーカイブから閲覧するためのWebアプリです。
      </footer>
    </div>
  );
}

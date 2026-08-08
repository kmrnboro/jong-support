import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";

import {
  loadArchiveIndex,
  type ArchiveIndex,
  type ArchiveIndexEntry,
} from "./archive/archiveIndex";
import { buildArchivePath } from "./archive/routes";
import { AppLayout } from "./components/AppLayout";
import type { TournamentArchive } from "./domain/archive";
import { ArchivePage } from "./pages/ArchivePage";
import { ArchiveUnlockPage } from "./pages/ArchiveUnlockPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StatisticsPage } from "./pages/StatisticsPage";

type ArchiveRouteProps = {
  entries: ArchiveIndexEntry[];
  archive: TournamentArchive | null;
  onUnlocked: (archive: TournamentArchive) => void;
};

function ArchiveRoute({ entries, archive, onUnlocked }: ArchiveRouteProps) {
  const { archiveId = "" } = useParams();
  const entry = entries.find((item) => item.archiveId === archiveId);
  if (entry === undefined) {
    return <NotFoundPage />;
  }
  return archive?.tournament.id === archiveId ? (
    <ArchivePage archive={archive} />
  ) : (
    <ArchiveUnlockPage entry={entry} onUnlocked={onUnlocked} />
  );
}

function StatisticsRoute({
  entries,
  archive,
}: Omit<ArchiveRouteProps, "onUnlocked">) {
  const { archiveId = "" } = useParams();
  if (!entries.some((entry) => entry.archiveId === archiveId)) {
    return <NotFoundPage />;
  }
  return archive?.tournament.id === archiveId ? (
    <StatisticsPage archive={archive} />
  ) : (
    <Navigate replace to={buildArchivePath(archiveId)} />
  );
}

export function App() {
  const [index, setIndex] = useState<ArchiveIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [archive, setArchive] = useState<TournamentArchive | null>(null);

  useEffect(() => {
    let active = true;
    loadArchiveIndex(`${import.meta.env.BASE_URL}archives/index.json`)
      .then((loadedIndex) => {
        if (active) {
          setIndex(loadedIndex);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setIndexError(
            error instanceof Error
              ? error.message
              : "大会一覧を取得できませんでした。",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const entries = index?.archives ?? [];

  return (
    <AppLayout>
      {indexError !== null ? (
        <section className="message-card">
          <p className="eyebrow">ARCHIVE INDEX ERROR</p>
          <h1>大会一覧を表示できません</h1>
          <p>{indexError}</p>
        </section>
      ) : index === null ? (
        <section className="message-card">
          <p className="eyebrow">LOADING</p>
          <h1>大会一覧を読み込んでいます…</h1>
        </section>
      ) : (
        <Routes>
          <Route index element={<HomePage entries={entries} />} />
          <Route
            path="archive/:archiveId"
            element={
              <ArchiveRoute
                entries={entries}
                archive={archive}
                onUnlocked={setArchive}
              />
            }
          />
          <Route
            path="archive/:archiveId/statistics"
            element={
              <StatisticsRoute entries={entries} archive={archive} />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}
    </AppLayout>
  );
}

import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { sampleArchiveEntry } from "./archive/archiveIndex";
import { buildArchivePath } from "./archive/routes";
import { AppLayout } from "./components/AppLayout";
import type { TournamentArchive } from "./domain/archive";
import { ArchivePage } from "./pages/ArchivePage";
import { ArchiveUnlockPage } from "./pages/ArchiveUnlockPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StatisticsPage } from "./pages/StatisticsPage";

export function App() {
  const [archive, setArchive] = useState<TournamentArchive | null>(null);
  const unlockedArchive =
    archive?.tournament.id === sampleArchiveEntry.archiveId ? archive : null;

  return (
    <AppLayout>
      <Routes>
        <Route index element={<HomePage entry={sampleArchiveEntry} />} />
        <Route
          path="archive/:archiveId"
          element={
            unlockedArchive !== null ? (
              <ArchivePage archive={unlockedArchive} />
            ) : (
              <ArchiveUnlockPage
                entry={sampleArchiveEntry}
                onUnlocked={setArchive}
              />
            )
          }
        />
        <Route
          path="archive/:archiveId/statistics"
          element={
            unlockedArchive !== null ? (
              <StatisticsPage archive={unlockedArchive} />
            ) : (
              <Navigate
                replace
                to={buildArchivePath(sampleArchiveEntry.archiveId)}
              />
            )
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}

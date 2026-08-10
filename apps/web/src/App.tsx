import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
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
import {
  summarizeArchive,
  type ArchiveStatisticsSummary,
} from "./domain/statistics";
import { ArchivePage } from "./pages/ArchivePage";
import { ArchiveUnlockPage } from "./pages/ArchiveUnlockPage";
import { CrossYearStatisticsPage } from "./pages/CrossYearStatisticsPage";
import { HomePage } from "./pages/HomePage";
import { MahjongResultEditPage } from "./pages/MahjongResultEditPage";
import { MahjongResultInputPage } from "./pages/MahjongResultInputPage";
import { MatchHistoryPage } from "./pages/MatchHistoryPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { TournamentDashboardPage } from "./pages/TournamentDashboardPage";
import { TournamentProgressPage } from "./pages/TournamentProgressPage";
import { createSampleTournamentSession } from "./tournament/sampleSession";
import {
  closeTournament,
  correctGame,
  registerGame,
  resumeTournament,
  startTournament,
  type CorrectionInput,
  type GameInput,
} from "./tournament/session";

type ArchiveRouteProps = {
  entries: ArchiveIndexEntry[];
  archive: TournamentArchive | null;
  onUnlocked: (archive: TournamentArchive) => void;
  page?: "ranking" | "statistics" | "matches";
};

function ArchiveRoute({
  entries,
  archive,
  onUnlocked,
  page = "ranking",
}: ArchiveRouteProps) {
  const { archiveId = "" } = useParams();
  const entry = entries.find((item) => item.archiveId === archiveId);
  if (entry === undefined) {
    return <NotFoundPage />;
  }
  if (archive?.tournament.id !== archiveId) {
    return page === "ranking" ? (
      <ArchiveUnlockPage entry={entry} onUnlocked={onUnlocked} />
    ) : (
      <Navigate replace to={buildArchivePath(archiveId)} />
    );
  }
  if (page === "statistics") {
    return <StatisticsPage archive={archive} />;
  }
  if (page === "matches") {
    return <MatchHistoryPage archive={archive} />;
  }
  return <ArchivePage archive={archive} />;
}

export function App() {
  const location = useLocation();
  const isTournamentRoute = location.pathname.startsWith(
    "/prototype/tournament",
  );
  const [index, setIndex] = useState<ArchiveIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [archive, setArchive] = useState<TournamentArchive | null>(null);
  const [archiveSummaries, setArchiveSummaries] = useState<
    ArchiveStatisticsSummary[]
  >([]);
  const [tournamentSession, setTournamentSession] = useState(
    createSampleTournamentSession,
  );
  const [tournamentMessage, setTournamentMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isTournamentRoute) {
      return;
    }
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
  }, [isTournamentRoute]);

  const entries = index?.archives ?? [];

  function handleUnlocked(loadedArchive: TournamentArchive) {
    setArchive(loadedArchive);
    setArchiveSummaries((current) => [
      ...current.filter(
        (summary) => summary.archiveId !== loadedArchive.tournament.id,
      ),
      summarizeArchive(loadedArchive),
    ]);
  }

  function handleRegisterGame(input: GameInput) {
    setTournamentSession(registerGame(tournamentSession, input));
    setTournamentMessage(
      `${input.roundNumber}回戦・${input.tableNumber}卓を登録しました。`,
    );
  }

  function handleCorrectGame(gameId: string, input: CorrectionInput) {
    setTournamentSession(correctGame(tournamentSession, gameId, input));
    setTournamentMessage(
      `${input.roundNumber}回戦・${input.tableNumber}卓を訂正しました。`,
    );
  }

  if (isTournamentRoute) {
    return (
      <AppLayout>
        <Routes>
          <Route
            path="prototype/tournament"
            element={
              <TournamentDashboardPage
                session={tournamentSession}
                message={tournamentMessage}
                onStart={() => {
                  setTournamentSession(startTournament(tournamentSession));
                  setTournamentMessage(null);
                }}
                onClose={() => {
                  setTournamentSession(closeTournament(tournamentSession));
                  setTournamentMessage(null);
                }}
                onResume={() => {
                  setTournamentSession(resumeTournament(tournamentSession));
                  setTournamentMessage("結果入力を再開しました。");
                }}
              />
            }
          />
          <Route
            path="prototype/tournament/progress"
            element={<TournamentProgressPage session={tournamentSession} />}
          />
          <Route
            path="prototype/tournament/input"
            element={
              tournamentSession.tournament.status === "active" ? (
                <MahjongResultInputPage
                  session={tournamentSession}
                  onRegister={handleRegisterGame}
                />
              ) : (
                <Navigate replace to="/prototype/tournament" />
              )
            }
          />
          <Route
            path="prototype/tournament/games/:gameId/edit"
            element={
              tournamentSession.tournament.status !== "preparing" ? (
                <MahjongResultEditPage
                  session={tournamentSession}
                  onCorrect={handleCorrectGame}
                />
              ) : (
                <Navigate replace to="/prototype/tournament" />
              )
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    );
  }

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
          <Route
            index
            element={
              <HomePage
                entries={entries}
                summarizedArchiveIds={new Set(
                  archiveSummaries.map((summary) => summary.archiveId),
                )}
              />
            }
          />
          <Route
            path="statistics"
            element={
              <CrossYearStatisticsPage summaries={archiveSummaries} />
            }
          />
          <Route
            path="archive/:archiveId"
            element={
              <ArchiveRoute
                entries={entries}
                archive={archive}
                onUnlocked={handleUnlocked}
              />
            }
          />
          <Route
            path="archive/:archiveId/statistics"
            element={
              <ArchiveRoute
                entries={entries}
                archive={archive}
                onUnlocked={handleUnlocked}
                page="statistics"
              />
            }
          />
          <Route
            path="archive/:archiveId/matches"
            element={
              <ArchiveRoute
                entries={entries}
                archive={archive}
                onUnlocked={handleUnlocked}
                page="matches"
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}
    </AppLayout>
  );
}

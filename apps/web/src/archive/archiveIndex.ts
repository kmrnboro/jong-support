export type ArchiveIndexEntry = {
  archiveId: string;
  title: string;
  date: string;
  revision: number;
  formatVersion: number;
  playerCount: number;
  gameCount: number;
  file: string;
};

export const sampleArchiveEntry: ArchiveIndexEntry = {
  archiveId: "2026-sample",
  title: "2026年度大会（匿名化サンプル）",
  date: "2026-07-01",
  revision: 1,
  formatVersion: 1,
  playerCount: 10,
  gameCount: 4,
  file: "archives/2026-sample.enc",
};

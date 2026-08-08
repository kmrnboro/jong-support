import { isArchiveIndex } from "./schemaValidation";

export type ArchiveIndexEntry = {
  archiveId: string;
  title: string;
  date: string;
  revision: number;
  formatVersion: 1;
  archiveSchemaVersion: "1.0.0";
  playerCount: number;
  gameCount: number;
  hasSubgame: boolean;
  file: string;
};

export type ArchiveIndex = {
  schemaVersion: "1.0.0";
  archives: ArchiveIndexEntry[];
};

export class ArchiveIndexLoadError extends Error {
  constructor() {
    super("大会一覧を取得できませんでした。時間をおいて再読み込みしてください。");
    this.name = "ArchiveIndexLoadError";
  }
}

export async function loadArchiveIndex(url: string): Promise<ArchiveIndex> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new ArchiveIndexLoadError();
  }
  if (!response.ok) {
    throw new ArchiveIndexLoadError();
  }

  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new ArchiveIndexLoadError();
  }
  if (!isArchiveIndex(value)) {
    throw new ArchiveIndexLoadError();
  }
  return value;
}

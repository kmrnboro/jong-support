export function buildArchivePath(archiveId: string): string {
  return `/archive/${encodeURIComponent(archiveId)}`;
}

export function buildStatisticsPath(archiveId: string): string {
  return `${buildArchivePath(archiveId)}/statistics`;
}

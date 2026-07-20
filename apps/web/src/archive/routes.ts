export function buildArchivePath(archiveId: string): string {
  return `/archive/${encodeURIComponent(archiveId)}`;
}

export function buildPlayerPath(playerId: string): string {
  return `/player/${encodeURIComponent(playerId)}`;
}

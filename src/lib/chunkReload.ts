const STALE_CHUNK_PATTERNS = [
  'Failed to fetch',
  'ChunkLoadError',
  'dynamically imported',
  'MIME type',
  'Expected a JavaScript',
]

export function isStaleChunkError(err: unknown): boolean {
  const msg = String(err)
  return STALE_CHUNK_PATTERNS.some((p) => msg.includes(p))
}

export function reloadOnStaleChunk(err: unknown): boolean {
  if (isStaleChunkError(err)) {
    window.location.reload()
    return true
  }
  return false
}

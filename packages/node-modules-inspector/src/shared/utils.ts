import type { NpmMetaLatest } from 'node-modules-tools'

export function isNpmMetaLatestValid(meta?: NpmMetaLatest): boolean {
  if (!meta)
    return false
  if (meta.vaildUntil < Date.now())
    return false
  return !!meta.publishedAt
}

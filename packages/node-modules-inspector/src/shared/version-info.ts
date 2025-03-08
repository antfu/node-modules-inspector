import type { ListPackagesNpmMetaOptions, NpmMeta } from './types'
import { getLatestVersion, getLatestVersionBatch } from 'fast-npm-meta'
import pLimit from 'p-limit'

export async function getPackagesNpmMeta(
  packages: string[],
  options: ListPackagesNpmMetaOptions,
) {
  const { storageNpmMeta: storage } = options

  const map = new Map<string, NpmMeta>()

  const known = await storage.keys()
  const unknown = packages.filter(p => !known.includes(p))

  const BATCH_SIZE = 10
  const limit = pLimit(10)
  const promises: Promise<void>[] = []
  const missingSpecs = new Set<string>()

  for (let i = 0; i < unknown.length; i += BATCH_SIZE) {
    const specs = unknown.slice(i, i + BATCH_SIZE)
    promises.push(limit(async () => {
      try {
        const result = await getLatestVersionBatch(specs, { metadata: true })
        for (const r of result) {
          if (r.publishedAt) {
            const spec = `${r.name}@${r.version}`
            const meta: NpmMeta = {
              time: r.publishedAt,
              deprecated: r.deprecated,
            }
            map.set(spec, meta)
            await storage.setItem(spec, meta)
          }
        }
      }
      catch {
        for (const spec of specs)
          missingSpecs.add(spec)
      }
    }))
  }

  await Promise.all(promises)

  // If batch failed, try to get publish date one by one
  if (missingSpecs.size) {
    await Promise.all(
      Array.from(missingSpecs).map(spec => limit(async () => {
        try {
          const result = await getLatestVersion(spec, { metadata: true })
          if (result.publishedAt) {
            const spec = `${result.name}@${result.version}`
            const meta: NpmMeta = {
              time: result.publishedAt,
              deprecated: result.deprecated,
            }
            map.set(spec, meta)
            await storage.setItem(spec, meta)
            missingSpecs.delete(spec)
          }
        }
        catch {}
      })),
    )
  }

  if (missingSpecs.size) {
    console.warn('Failed to get publish date for:', [...missingSpecs])
  }

  await Promise.all(packages.map(async (p) => {
    if (!map.has(p)) {
      const date = await storage.getItem(p)
      if (date)
        map.set(p, date)
    }
  }))

  return map
}

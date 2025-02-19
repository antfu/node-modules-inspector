import type { Storage } from 'unstorage'
import { getLatestVersion, getLatestVersionBatch } from 'fast-npm-meta'
import pLimit from 'p-limit'

export interface ListPackagePublishDatesOptions {
  storagePublishDates: Storage<string>
}

export async function getPackagesPublishDate(
  packages: string[],
  options: ListPackagePublishDatesOptions,
) {
  const { storagePublishDates: storage } = options

  const map = new Map<string, string>()

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
        const result = await getLatestVersionBatch(specs)
        for (const r of result) {
          if (r.publishedAt) {
            const spec = `${r.name}@${r.version}`
            map.set(spec, r.publishedAt)
            await storage.setItem(spec, r.publishedAt)
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
          const result = await getLatestVersion(spec)
          if (result.publishedAt) {
            const spec = `${result.name}@${result.version}`
            map.set(spec, result.publishedAt)
            await storage.setItem(spec, result.publishedAt)
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

import type { Storage } from 'unstorage'
import { getLatestVersionBatch } from 'fast-npm-meta'
import pLimit from 'p-limit'

export interface ListPackagePublishDatesOptions {
  storage: Storage<string>
}

export async function getPackagesPublishDate(
  packages: string[],
  options: ListPackagePublishDatesOptions,
) {
  const { storage } = options

  const map = new Map<string, string>()

  const known = await storage.keys()
  const unknown = packages.filter(p => !known.includes(p))

  const BATCH_SIZE = 5
  const limit = pLimit(10)
  const promises: Promise<void>[] = []

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
      catch (e) {
        console.error('Failed to get packages publish date', specs)
        console.error(e)
      }
    }))
  }

  await Promise.all(promises)

  await Promise.all(packages.map(async (p) => {
    if (!map.has(p)) {
      const date = await storage.getItem(p)
      if (date)
        map.set(p, date)
    }
  }))

  return map
}

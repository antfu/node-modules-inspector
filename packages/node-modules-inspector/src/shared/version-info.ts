import type { ResolvedPackageVersionWithMetadata } from 'fast-npm-meta'
import type { NpmMeta, NpmMetaLatest } from 'node-modules-tools'
import type { ListPackagesNpmMetaLatestOptions, ListPackagesNpmMetaOptions } from './types'
import { getLatestVersion, getLatestVersionBatch } from 'fast-npm-meta'
import pLimit from 'p-limit'
import { isNpmMetaLatestValid } from './utils'
import { addPackagesNpmVulnerabilityMeta } from './vulnerable-info'

const HOUR = 1000 * 60 * 60
const DAY = HOUR * 24

async function fetchBatch(
  specs: string[],
  onResult: (result: ResolvedPackageVersionWithMetadata) => void,
) {
  const promises: Promise<void>[] = []
  const missingSpecs = new Set<string>()
  const BATCH_SIZE = 10
  const limit = pLimit(10)

  for (let i = 0; i < specs.length; i += BATCH_SIZE) {
    const queue = specs.slice(i, i + BATCH_SIZE)
    promises.push(limit(async () => {
      try {
        const result = await getLatestVersionBatch(queue, { metadata: true })
        result.forEach((r, idx) => {
          if ('publishedAt' in r && r.publishedAt) {
            onResult(r)
          }
          else {
            console.warn('Failed to get publishedAt for:', r)
            missingSpecs.add(queue[idx])
          }
        })
      }
      catch {
        for (const spec of queue)
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
          if ('publishedAt' in result && result.publishedAt) {
            missingSpecs.delete(spec)
            onResult(result)
          }
        }
        catch {}
      })),
    )
  }

  return {
    missing: missingSpecs,
  }
}

export async function getPackagesNpmMeta(
  packages: string[],
  options: ListPackagesNpmMetaOptions,
) {
  const { storageNpmMeta: storage } = options

  const map = new Map<string, NpmMeta>()
  const known = await storage.keys()
  const unknown = packages.filter(p => !known.includes(p))

  const {
    missing,
  } = await fetchBatch(unknown, async (r) => {
    const spec = `${r.name}@${r.version}`
    const meta: NpmMeta = {
      publishedAt: new Date(r.publishedAt!).getTime(),
      deprecated: r.deprecated,
    }
    map.set(spec, meta)
    await storage.setItem(spec, meta)
  })
  // /advisories/bulk has CORP issue.
  if (import.meta.env.BACKEND !== 'webcontainer') {
    await addPackagesNpmVulnerabilityMeta(packages, options)
  }
  if (missing.size) {
    console.warn('Failed to get npm meta for:', [...missing])
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

export async function getPackagesNpmMetaLatest(
  packages: string[],
  options: ListPackagesNpmMetaLatestOptions,
): Promise<Map<string, NpmMetaLatest | null>> {
  const { storageNpmMetaLatest: storage } = options

  const map = new Map<string, NpmMetaLatest>()

  packages.forEach((p) => {
    if (p.split(/@/g).length >= 3)
      throw new Error(`Invalid package name: ${p}`)
  })

  await Promise.all(packages.map(async (p) => {
    const meta = await storage.getItem(p)
    if (!meta)
      return
    if (!isNpmMetaLatestValid(meta)) {
      await storage.removeItem(p)
      return
    }
    map.set(p, meta)
  }))

  const unknown = packages.filter(p => !map.has(p))

  const {
    missing,
  } = await fetchBatch(unknown.map(p => `${p}@latest`), async (r) => {
    const publishedAt = new Date(r.publishedAt!).getTime()
    const timePassed = Date.now() - publishedAt

    // TTL is based on how long the package has been published
    // Min 5 hours, max 15 days
    // Otherwise it's 3% of the time passed (1 year package will have roughly 10 days TTL)
    const ttl = Math.min(Math.max(5 * HOUR, timePassed * 0.03), 15 * DAY)

    const meta: NpmMetaLatest = {
      publishedAt,
      deprecated: r.deprecated,
      version: r.version!,
      fetechedAt: Date.now(),
      vaildUntil: Date.now() + ttl,
    }
    map.set(r.name, meta)
    await storage.setItem(r.name, meta)
  })

  if (missing.size) {
    console.warn('Failed to get npm meta for:', [...missing])
  }

  return map
}

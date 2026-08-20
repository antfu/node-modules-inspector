import type { PackageJson } from 'pkg-types'
import type { RegistryCache, RegistryPackument } from './types'

export const DEFAULT_REGISTRY = 'https://registry.npmjs.org'

/** Abbreviated ("corgi") packument media type — much smaller than the full document */
const ACCEPT_ABBREVIATED = 'application/vnd.npm.install-v1+json'

const DAY = 24 * 60 * 60 * 1000
export const DEFAULT_PACKUMENT_TTL = 7 * DAY

export interface RegistryFetcherOptions {
  registry?: string
  fetch?: typeof globalThis.fetch
  cachePackument?: RegistryCache
  cachePackumentTtl?: number
  cacheManifest?: RegistryCache
}

interface CachedPackument {
  fetchedAt: number
  data: RegistryPackument
}

export interface RegistryFetcher {
  getPackument: (name: string) => Promise<RegistryPackument>
  getManifest: (name: string, version: string) => Promise<PackageJson>
}

function encodeName(name: string): string {
  // Scoped package names keep the `@` but encode the inner slash
  return name.replace('/', '%2F')
}

/**
 * Create a fetcher for registry metadata, with in-memory request dedupe
 * and optional persistent caches.
 */
export function createRegistryFetcher(options: RegistryFetcherOptions = {}): RegistryFetcher {
  const {
    registry = DEFAULT_REGISTRY,
    fetch = globalThis.fetch,
    cachePackument,
    cachePackumentTtl = DEFAULT_PACKUMENT_TTL,
    cacheManifest,
  } = options

  const base = registry.replace(/\/$/, '')
  const packuments = new Map<string, Promise<RegistryPackument>>()
  const manifests = new Map<string, Promise<PackageJson>>()

  async function fetchJson(url: string, accept?: string): Promise<any> {
    const res = await fetch(url, {
      headers: accept ? { accept } : undefined,
    })
    if (!res.ok)
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
    return res.json()
  }

  function getPackument(name: string): Promise<RegistryPackument> {
    if (!packuments.has(name)) {
      packuments.set(name, (async () => {
        const cached = await cachePackument?.getItem(name) as CachedPackument | null | undefined
        if (cached?.data && Date.now() - cached.fetchedAt < cachePackumentTtl)
          return cached.data
        const data = await fetchJson(`${base}/${encodeName(name)}`, ACCEPT_ABBREVIATED) as RegistryPackument
        await cachePackument?.setItem(name, { fetchedAt: Date.now(), data } satisfies CachedPackument)
        return data
      })().catch((err) => {
        // Allow retries on failure
        packuments.delete(name)
        throw err
      }))
    }
    return packuments.get(name)!
  }

  function getManifest(name: string, version: string): Promise<PackageJson> {
    const spec = `${name}@${version}`
    if (!manifests.has(spec)) {
      manifests.set(spec, (async () => {
        // A published version's manifest is immutable — cache forever
        const cached = await cacheManifest?.getItem(spec) as PackageJson | null | undefined
        if (cached)
          return cached
        const data = await fetchJson(`${base}/${encodeName(name)}/${version}`) as PackageJson
        await cacheManifest?.setItem(spec, data)
        return data
      })().catch((err) => {
        manifests.delete(spec)
        throw err
      }))
    }
    return manifests.get(spec)!
  }

  return {
    getPackument,
    getManifest,
  }
}

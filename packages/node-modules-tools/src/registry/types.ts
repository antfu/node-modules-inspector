import type { ListPackageDependenciesResult } from '../types'

/**
 * A single version entry of an abbreviated ("corgi") packument.
 * @see https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#abbreviated-metadata-format
 */
export interface RegistryAbbreviatedVersion {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
  bundleDependencies?: string[] | boolean
  deprecated?: string
  hasInstallScript?: boolean
  dist?: {
    tarball?: string
    integrity?: string
    unpackedSize?: number
    fileCount?: number
  }
}

/**
 * An abbreviated ("corgi") packument from the npm registry.
 */
export interface RegistryPackument {
  'name': string
  'dist-tags': Record<string, string>
  'versions': Record<string, RegistryAbbreviatedVersion>
  'modified'?: string
}

/**
 * Minimal async key-value cache used to persist registry responses
 * (e.g. backed by IndexedDB in the browser, or the filesystem in Node).
 */
export interface RegistryCache<T = any> {
  getItem: (key: string) => Promise<T | null | undefined>
  setItem: (key: string, value: T) => Promise<void>
}

export interface ResolveRegistryDependenciesProgress {
  /** Current phase: resolving the graph, or fetching full manifests */
  phase: 'resolving' | 'manifests'
  /** Number of packages resolved so far */
  count: number
  /** Total number of packages (only known in the `manifests` phase) */
  total?: number
}

export type RegistryResolveWarningType
  = | 'unsupported-spec'
    | 'unresolved-version'
    | 'fetch-error'

export interface RegistryResolveWarning {
  type: RegistryResolveWarningType
  /** Package name the warning is about */
  name: string
  /** The raw spec or range that caused the warning */
  spec: string
  /** The dependent package that requested it, if any */
  dependent?: string
  /** Human-readable description */
  message: string
}

export interface ResolveRegistryDependenciesOptions {
  /**
   * Top-level dependencies to resolve, name to version range
   * (e.g. `{ vue: '^3.4.0', react: 'latest' }`).
   */
  dependencies: Record<string, string>
  /**
   * Registry base URL
   * @default 'https://registry.npmjs.org'
   */
  registry?: string
  /**
   * Maximum depth of transitive dependencies to traverse
   * @default 8
   */
  depth?: number
  /**
   * Maximum concurrent registry requests
   * @default 16
   */
  concurrency?: number
  /**
   * Name for the synthetic workspace root package
   * @default 'node-modules-inspector-registry'
   */
  rootName?: string
  /**
   * Custom fetch implementation (for testing or proxying)
   * @default globalThis.fetch
   */
  fetch?: typeof globalThis.fetch
  /**
   * Cache for abbreviated packuments (mutable — entries carry a TTL)
   */
  cachePackument?: RegistryCache
  /**
   * TTL for cached packuments, in milliseconds
   * @default 7 days
   */
  cachePackumentTtl?: number
  /**
   * Cache for full version manifests (immutable — cached forever)
   */
  cacheManifest?: RegistryCache
  /**
   * Progress callback, called as packages get resolved
   */
  onProgress?: (progress: ResolveRegistryDependenciesProgress) => void
}

export interface ResolveRegistryDependenciesResult extends ListPackageDependenciesResult {
  /** Non-fatal problems encountered during resolution (skipped specs, etc.) */
  warnings: RegistryResolveWarning[]
}

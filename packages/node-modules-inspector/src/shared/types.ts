import type { ListPackageDependenciesResult, PackageNode, PackageNodeRaw } from 'node-modules-tools'
import type { Message as PublintMessage } from 'publint'
import type { Storage } from 'unstorage'
import type { FilterOptions } from './filters'

export type { FilterOptions, PublintMessage }

export interface NodeModulesInspectorPayload extends ListPackageDependenciesResult {
  timestamp: number
  hash: string
  config?: NodeModulesInspectorConfig
}

export interface ServerFunctions {
  getPayload: (force?: boolean) => Promise<NodeModulesInspectorPayload>
  getPackagesNpmMeta: (specs: string[]) => Promise<Map<string, NpmMeta>>
  getPackagesNpmMetaLatest: (pkgNames: string[]) => Promise<Map<string, NpmMetaLatest>>
  getPublint: (pkg: Pick<PackageNode, 'private' | 'workspace' | 'spec' | 'filepath'>) => Promise<PublintMessage[] | null>
  openInEditor: (filename: string) => void
  openInFinder: (filename: string) => void
}

export interface NodeModulesInspectorConfig {
  /**
   * The name of the project
   */
  name?: string
  /**
   * Fetch meta data like publish date, deprecated info, from npm
   * This will require internet connection.
   * The result will be cached in filesystem or IndexedDB.
   *
   * @default true
   */
  fetchNpmMeta?: boolean
  /**
   * Enable publint
   *
   * @experimental
   * @see https://publint.dev/
   * @default false
   */
  publint?: boolean
  /**
   * Exclude the packages and it's dependencies
   */
  excludePackages?: (string | ((node: PackageNodeRaw) => boolean))[]
  /**
   * Present the packages matched as no dependencies
   */
  excludeDependenciesOf?: (string | ((node: PackageNodeRaw) => boolean))[]
  /**
   * Default filters for the frontend
   */
  defaultFilters?: Partial<FilterOptions>
  /**
   * Default settings for the frontend
   */
  defaultSettings?: Partial<SettingsOptions>
}

export interface SettingsOptions {
  graphRender: 'normal' | 'dots'
  moduleTypeSimple: boolean
  moduleTypeRender: 'badge' | 'circle' | 'none'
  deepDependenciesTree: boolean
  packageDetailsTab: 'dependencies' | 'dependents'
  colorizePackageSize: boolean
  showInstallSizeBadge: boolean
  showPublishTimeBadge: boolean
  showFileComposition: boolean
  showDependencySourceBadge: 'none' | 'dev' | 'prod' | 'both'
  treatFauxAsESM: boolean
  showPublintMessages: boolean
}

export type RemoveVoidKeysFromObject<T> = { [K in keyof T]: T[K] extends void ? never : K } extends { [_ in keyof T]: never } ? T : { [K in keyof T as T[K] extends void ? never : K]: T[K] }

export interface ClientFunctions {}

export type ServerFunctionsDump = Omit<
  RemoveVoidKeysFromObject<{
    [K in keyof ServerFunctions]: Awaited<ReturnType<ServerFunctions[K]>>
  }>,
  'getPublint' | 'getPackagesNpmMeta' | 'getPackagesNpmMetaLatest'
>

export interface ConnectionMeta {
  backend: 'websocket' | 'static'
  websocket?: number
}

export interface NpmMeta {
  publishedAt: number
  deprecated?: string
}

/**
 * Npm meta of the latest version of a certain package
 * Unlike NpmMeta with is immutable, NpmMetaLatest is coupled with time,
 * so the `vaildUntil` is used to determine if the meta would need to be updated.
 */
export interface NpmMetaLatest extends NpmMeta {
  version: string
  /**
   * Date when the meta was fetched
   */
  fetechedAt: number
  /**
   * We calculate a smart "TTL" based on how open the package updates.
   * If this timestemp is greater than the current time, the meta should be discarded.
   */
  vaildUntil: number
}

export interface ListPackagesNpmMetaOptions {
  storageNpmMeta: Storage<NpmMeta>
}

export interface ListPackagesNpmMetaLatestOptions {
  storageNpmMetaLatest: Storage<NpmMetaLatest>
}

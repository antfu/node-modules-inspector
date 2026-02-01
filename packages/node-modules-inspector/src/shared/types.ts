import type { ListPackageDependenciesResult, NpmMeta, NpmMetaLatest, PackageNode, PackageNodeRaw, PublintMessage } from 'node-modules-tools'
import type { Storage } from 'unstorage'
import type { FilterOptions } from './filters'

export type { FilterOptions }

export interface NodeModulesInspectorPayload extends ListPackageDependenciesResult {
  timestamp: number
  hash: string
  config?: NodeModulesInspectorConfig
}

export interface NodeModulesInspectorHeartbeat {
  status: 'heartbeat'
  heartbeat: number
}

export interface NodeModulesInspectorError {
  status: 'error'
  error: any
}

export type NodeModulesInspectorLog
  = NodeModulesInspectorPayload
    | NodeModulesInspectorHeartbeat
    | NodeModulesInspectorError

export interface ServerFunctions {
  getPayload: (force?: boolean) => Promise<NodeModulesInspectorPayload>
  getPackagesNpmMeta: (specs: string[]) => Promise<Map<string, NpmMeta | null>>
  getPackagesNpmMetaLatest: (pkgNames: string[]) => Promise<Map<string, NpmMetaLatest | null>>
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
  showThirdPartyServices: boolean
  chartColoringMode: 'spectrum' | 'module'
  collapseSidepanel: boolean
  chartAnimation: boolean
  preferNpmx: boolean
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

export interface ListPackagesNpmMetaOptions {
  storageNpmMeta: Storage<NpmMeta>
}

export interface ListPackagesNpmMetaLatestOptions {
  storageNpmMetaLatest: Storage<NpmMetaLatest>
}

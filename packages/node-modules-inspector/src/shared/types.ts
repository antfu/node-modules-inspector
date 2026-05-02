import type { ListPackageDependenciesResult, NpmMeta, NpmMetaLatest, PackageNodeRaw } from 'node-modules-tools'
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

export interface ListPackagesNpmMetaOptions {
  storageNpmMeta: Storage<NpmMeta>
}

export interface ListPackagesNpmMetaLatestOptions {
  storageNpmMetaLatest: Storage<NpmMetaLatest>
}

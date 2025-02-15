import type { ListPackageDependenciesResult, PackageNodeRaw } from 'node-modules-tools'
import type { FilterOptions } from './filters'

export type { FilterOptions }

export interface ServerFunctions {
  getConfig: () => Promise<NodeModulesInspectorConfig>
  listDependencies: () => Promise<ListPackageDependenciesResult>
  getPackagesPublishDate: (deps: string[]) => Promise<Map<string, string>>
  openInEditor: (filename: string) => void
  openInFinder: (filename: string) => void
}

export interface NodeModulesInspectorConfig {
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
  moduleTypeSimple: boolean
  moduleTypeRender: 'badge' | 'circle' | 'none'
  deepDependenciesTree: boolean
  packageDetailsTab: 'dependencies' | 'dependents'
  colorizePackageSize: boolean
  showInstallSizeBadge: boolean
  showPublishTimeBadge: boolean
  showFileComposition: boolean
  treatFauxAsESM: boolean
}

export type RemoveVoidKeysFromObject<T> = { [K in keyof T]: T[K] extends void ? never : K } extends { [_ in keyof T]: never } ? T : { [K in keyof T as T[K] extends void ? never : K]: T[K] }

export interface ClientFunctions {}

export type ServerFunctionsDump = RemoveVoidKeysFromObject<{
  [K in keyof ServerFunctions]: Awaited<ReturnType<ServerFunctions[K]>>
}>

export interface ConnectionMeta {
  websocket: number
}

import type { ListPackageDependenciesResult, PackageNode, PackageNodeRaw } from 'node-modules-tools'
import type { Message as PublintMessage } from 'publint'
import type { FilterOptions } from './filters'

export type { FilterOptions, PublintMessage }

export interface NodeModulesInspectorPayload extends ListPackageDependenciesResult {
  timestamp: number
  hash: string
  config?: NodeModulesInspectorConfig
}

export interface ServerFunctions {
  getPayload: (force?: boolean) => Promise<NodeModulesInspectorPayload>
  getPackagesPublishDate: (deps: string[]) => Promise<Map<string, string>>
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
   * Fetch the publish date of the packages
   *
   * @default true
   */
  fetchPublishDate?: boolean
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
  'getPublint' | 'getPackagesPublishDate'
>

export interface ConnectionMeta {
  backend: 'websocket' | 'static'
  websocket?: number
}

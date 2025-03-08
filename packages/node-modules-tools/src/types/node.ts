import type { PackageJsonExports } from 'pkg-types'
import type { Message as PublintMessage } from 'publint'
import type { PackageInstallSizeInfo } from './size'

export type { PublintMessage }

export type PackageModuleTypeSimple = 'cjs' | 'esm'
export type PackageModuleType = 'cjs' | 'esm' | 'dual' | 'faux' | 'dts'

export interface PackageNodeRaw {
  /** Package Name */
  name: string
  /** Version */
  version: string
  /** Combined name and version using `@` */
  spec: string
  /** Absolute file path of the package */
  filepath: string
  /** Direct dependencies of this package */
  dependencies: Set<string>

  /** Is this package from local workspace */
  workspace?: boolean
  /** Is this package private */
  private?: boolean

  /**
   * Cluster of this package.
   * Cluster is a set of labels that will inherits to all nested dependencies.
   *
   * Typically it would includes things like `dep:dev` or `dep:prod`,
   * or catalogs like `catalog:default` or `catalog:custom-named`.
   */
  clusters: Set<string>
}

export interface PackageNodeBase extends PackageNodeRaw {
  /** Direct dependents of this package */
  dependents: Set<string>
  /** The lowest depth of this package */
  depth: number
  /** All nested dependencies of this package */
  flatDependencies: Set<string>
  /** All nested  dependents of this package */
  flatDependents: Set<string>
  /** All clusters of this package */
  flatClusters: Set<string>
}

export interface PackageNode extends PackageNodeBase {
  resolved: {
    module: PackageModuleType
    license?: string
    author?: string
    repository?: string
    fundings?: {
      url: string
      type?: string
    }[]
    exports?: PackageJsonExports
    homepage?: string
    engines?: Record<string, string>
    installSize?: PackageInstallSizeInfo
    npmMeta?: NpmMeta
    npmMetaLatest?: NpmMetaLatest
    /**
     * Result for publint, null for invalid, undefined for not checked yet, empty array for all good
     */
    publint?: PublintMessage[] | null
  }
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

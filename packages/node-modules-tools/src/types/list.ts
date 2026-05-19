import type { BaseOptions } from './base'
import type { PackageNode, PackageNodeBase, PackageNodeRaw } from './node'

export interface ListPackageDependenciesOptions extends BaseOptions {
  /**
   * Depeth of the dependency tree
   */
  depth: number
  /**
   * Should it list dependencies of all packages in the monorepo
   */
  monorepo: boolean
  /**
   * Filter if a package should be included and continue traversing
   */
  traverseFilter?: (node: PackageNodeRaw) => boolean
  /**
   * Filter if workspace should be recognized
   */
  workspace?: boolean
  /**
   * Filter whether a package's dependencies should be included
   */
  dependenciesFilter?: (node: PackageNodeRaw) => boolean
}

export interface ListPackageDependenciesRawResult {
  root: string
  packageManager: string
  packageManagerVersion?: string
  packages: Map<string, PackageNodeRaw>
  /**
   * Catalog name → (dep name → range), as declared by the workspace manifest
   * (e.g. `pnpm-workspace.yaml`). Used to resolve `catalog:<name>` ranges back
   * to actual semver ranges.
   */
  catalogs?: Record<string, Record<string, string>>
}

export interface ListPackageDependenciesBaseResult extends ListPackageDependenciesRawResult {
  packages: Map<string, PackageNodeBase>
}

export interface ListPackageDependenciesResult extends ListPackageDependenciesBaseResult {
  packages: Map<string, PackageNode>
}

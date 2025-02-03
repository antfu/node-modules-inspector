export type PackageModuleTypeSimple = 'cjs' | 'esm'
export type PackageModuleType = 'cjs' | 'esm' | 'dual' | 'faux' | 'dts'

export interface ListPackageDependenciesOptions {
  /**
   * Current working directory
   */
  cwd: string
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
}

export interface ListPackageDependenciesRawResult {
  root: string
  packageManager: string
  packageManagerVersion?: string
  packages: Map<string, PackageNodeRaw>
}

export interface ListPackageDependenciesBaseResult extends ListPackageDependenciesRawResult {
  packages: Map<string, PackageNodeBase>
}

export interface ListPackageDependenciesResult extends ListPackageDependenciesBaseResult {
  packages: Map<string, PackageNode>
}

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
  /** Is this package part of devDependencies */
  dev?: boolean
  /** Is this package part of dependencies */
  prod?: boolean
  /** Is this package part of optionalDependencies */
  optional?: boolean
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
}

export interface PackageNode extends PackageNodeBase {
  resolved: {
    module: PackageModuleType
    license?: string
    author?: string
    repository?: string
    homepage?: string
    engines?: Record<string, string>
  }
}

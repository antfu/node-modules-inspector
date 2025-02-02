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
  traverseFilter?: (node: PackageNodeBase) => boolean
}

export interface ListPackageDependenciesRawResult {
  cwd: string
  packageManager: string
  packages: Map<string, PackageNodeBase>
}

export interface ListPackageDependenciesResult extends ListPackageDependenciesRawResult {
  packages: Map<string, PackageNode>
}

export interface PackageNodeBase {
  /** Package Name */
  name: string
  /** Version */
  version: string
  /** Combined name and version using `@` */
  spec: string
  /** Absolute file path of the package */
  path: string
  /** Direct dependencies of this package */
  dependencies: Set<string>
  /** Direct dependents of this package */
  dependents: Set<string>
  /** All nested dependencies of this package */
  flatDependencies: Set<string>
  /** All nested  dependents of this package */
  flatDependents: Set<string>
  /** Nested levels of this package */
  nestedLevels: Set<number>
  /** Is this package part of devDependencies */
  dev: boolean
  /** Is this package part of dependencies */
  prod: boolean
  /** Is this package part of optionalDependencies */
  optional: boolean
}

export interface PackageNode extends PackageNodeBase {
  resolved: {
    module: PackageModuleType
    license?: string
    author?: string
    repository?: string
    engines?: Record<string, string>
  }
}

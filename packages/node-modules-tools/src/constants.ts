import type { PackageModuleType } from './types'

export const PackageModuleTypes: readonly PackageModuleType[] = Object.freeze(['cjs', 'esm', 'dual', 'faux', 'dts'])

export const CLUSTER_DEP_PROD = 'dep:prod'
export const CLUSTER_DEP_DEV = 'dep:dev'
export const CLUSTER_DEP_OPTIONAL = 'dep:optional'

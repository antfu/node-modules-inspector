import type { PackageJson } from 'pkg-types'
import type { PackageNode } from './types'
import { objectPick } from '@antfu/utils'
import { analyzePackageModuleType } from './analyze-esm'
import { normalizePkgAuthors, normalizePkgFundings, normalizePkgLicense, normalizePkgRepository } from './utils/package-json'

// @keep-unique
// @keep-sorted
export const PACKAGE_JSON_KEYS = [
  'author',
  'authors',
  'bin',
  'bugs',
  'dependencies',
  'description',
  'devDependencies',
  'engines',
  'exports',
  'funding',
  'fundings',
  'homepage',
  'imports',
  'keywords',
  'license',
  'licenses',
  'main',
  'module',
  'name',
  'optionalDependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'repository',
  'types',
  'version',
] satisfies (keyof PackageJson)[]

/**
 * Compute the pure (filesystem-free) part of `PackageNode['resolved']`
 * from a plain package.json object.
 */
export function resolvePackageJsonFields(json: PackageJson): Omit<PackageNode['resolved'], 'installSize'> {
  return {
    module: analyzePackageModuleType(json),
    packageJson: objectPick(json, PACKAGE_JSON_KEYS),
    authors: normalizePkgAuthors(json),
    repository: normalizePkgRepository(json),
    license: normalizePkgLicense(json),
    fundings: normalizePkgFundings(json),
  }
}

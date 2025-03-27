import type { PackageNode } from 'node-modules-tools'
import { normalizePkgAuthors, normalizePkgFundings, normalizePkgLicense, normalizePkgRepository } from 'node-modules-tools/utils'

function weakCachedFunction<T extends WeakKey, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new WeakMap<T, R>()

  return (arg: T) => {
    if (cache.has(arg))
      return cache.get(arg)!
    const result = fn(arg)
    cache.set(arg, result)
    return result
  }
}

export const getAuthors = weakCachedFunction((pkg: PackageNode) => normalizePkgAuthors(pkg.resolved.packageJson))
export const getRepository = weakCachedFunction((pkg: PackageNode) => normalizePkgRepository(pkg.resolved.packageJson))
export const getFundings = weakCachedFunction((pkg: PackageNode) => normalizePkgFundings(pkg.resolved.packageJson))
export const getLicense = weakCachedFunction((pkg: PackageNode) => normalizePkgLicense(pkg.resolved.packageJson))

export const getPackageData = weakCachedFunction((pkg: PackageNode) => {
  return {
    license: getLicense(pkg),
    homepage: pkg.resolved.packageJson.homepage,
    engines: pkg.resolved.packageJson.engines,
    authors: getAuthors(pkg),
    repository: getRepository(pkg)?.url,
    fundings: getFundings(pkg),
  }
})

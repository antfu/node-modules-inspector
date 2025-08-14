import { satisfies } from 'semver'

export interface PackageNodeLike {
  name: string
  version: string
}

/**
 * Construct a filter to match a package name
 *
 * - @foo/bar@1.0.0 or foobar@1.0.0 -> Exact match
 * - @foo/bar@* or @foo/bar -> Any version of the package
 * - @foo/bar@^1.0.0 -> Any version that matches the semver range
 * - bar-* -> Any version that matches the prefix
 * - *eslint* -> Any version that matches the wildcard
 */
export function constructPackageFilter(range: string): (pkg: PackageNodeLike) => boolean {
  const [name, version = '*'] = range.split(/\b@/) as [string, string]
  const hasWildcard = name?.includes('*')
  const nameMatch = hasWildcard
    ? new RegExp(`^${Array.from(name).map(char => char === '*' ? '.*' : char === '.' ? '\\.' : char).join('')}$`)
    : name

  return (pkg) => {
    const isNameMatch = nameMatch instanceof RegExp ? nameMatch.test(pkg.name) : pkg.name === name
    const isVersionMatch = version === '*' || pkg.version === version || satisfies(pkg.version, version)
    return isNameMatch && isVersionMatch
  }
}

export function constructPackageFilters<Node extends PackageNodeLike = PackageNodeLike>(
  ranges: (string | ((pkg: Node) => boolean)) [],
  mode: 'some' | 'every',
): (pkg: Node) => boolean {
  const filters = ranges.map(x => typeof x === 'string' ? constructPackageFilter(x) : x)
  return pkg => mode === 'some'
    ? filters.some(filter => filter(pkg))
    : filters.every(filter => filter(pkg))
}

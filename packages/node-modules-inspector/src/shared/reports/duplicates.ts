import type { PackageNode } from 'node-modules-tools'
import type { DuplicatesEntry } from './dto'
import { compareSemver } from '../semver'

export interface ComputeDuplicatesOptions {
  /** Only include packages installed at this many versions or more. Default `2`. */
  minVersions?: number
  /** Cap the number of returned entries. */
  limit?: number
}

export function computeDuplicates(
  packages: Iterable<PackageNode>,
  options: ComputeDuplicatesOptions = {},
): DuplicatesEntry[] {
  const minVersions = options.minVersions ?? 2

  const byName = new Map<string, PackageNode[]>()
  for (const pkg of packages) {
    let bucket = byName.get(pkg.name)
    if (!bucket) {
      bucket = []
      byName.set(pkg.name, bucket)
    }
    bucket.push(pkg)
  }

  const entries: DuplicatesEntry[] = []
  for (const [name, pkgs] of byName) {
    if (pkgs.length < minVersions)
      continue
    const sorted = pkgs.slice().sort((a, b) => compareSemver(a.version, b.version))
    entries.push({
      name,
      versions: sorted.map(p => p.version),
      specs: sorted.map(p => p.spec),
    })
  }

  entries.sort((a, b) => (b.versions.length - a.versions.length) || a.name.localeCompare(b.name))

  return options.limit ? entries.slice(0, options.limit) : entries
}

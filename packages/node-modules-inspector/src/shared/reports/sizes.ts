import type { PackageNode } from 'node-modules-tools'
import type { SizesEntry } from './dto'

export interface ComputeSizesOptions {
  /** Cap the number of returned entries. Default `50`. */
  limit?: number
  /** Include workspace packages (default: false — workspace packages have no meaningful install size). */
  includeWorkspace?: boolean
}

export function computeInstallSizes(
  packages: Iterable<PackageNode>,
  options: ComputeSizesOptions = {},
): SizesEntry[] {
  const includeWorkspace = options.includeWorkspace ?? false
  const limit = options.limit ?? 50

  const entries: SizesEntry[] = []
  for (const pkg of packages) {
    const info = pkg.resolved.installSize
    if (!info?.bytes)
      continue
    if (!includeWorkspace && pkg.workspace)
      continue
    entries.push({
      spec: pkg.spec,
      name: pkg.name,
      version: pkg.version,
      workspace: pkg.workspace === true,
      bytes: info.bytes,
      categories: info.categories,
    })
  }

  entries.sort((a, b) => b.bytes - a.bytes)
  return limit > 0 ? entries.slice(0, limit) : entries
}

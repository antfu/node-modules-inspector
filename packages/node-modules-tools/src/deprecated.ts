import type { PackageNodeRaw } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import { join } from 'pathe'

export interface DeprecatedInfo {
  current: {
    deprecated: boolean
    message?: string
  }
  last: {
    deprecated: boolean
    message?: string
  }
}

/**
 * Get deprecated information for a package
 * This will check if the package is deprecated in the npm registry
 * Results are cached in /tmp/node-modules-inspector/deprecated/[packageName].json
 */
export async function getPackageDeprecatedInfo(
  pkg: PackageNodeRaw,
): Promise<DeprecatedInfo> {
  if (pkg.workspace) {
    return {
      current: { deprecated: false },
      last: { deprecated: false },
    }
  }
  if (pkg.name.startsWith('#')) {
    return {
      current: { deprecated: false },
      last: { deprecated: false },
    }
  }
  if (pkg.version.match(/^(?:file|link|workspace):/)) {
    return {
      current: { deprecated: false },
      last: { deprecated: false },
    }
  }

  // Create cache directory if it doesn't exist
  const cacheDir = '/tmp/node-modules-inspector/deprecated'
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  const cacheFile = join(cacheDir, `${pkg.name}.json`)

  // Check if we have cached data
  try {
    if (existsSync(cacheFile)) {
      const cachedData = JSON.parse(await fs.readFile(cacheFile, 'utf-8'))
      return cachedData
    }
  }
  catch {
    // If there's an error reading the cache, we'll fetch fresh data
  }

  // Fetch package data from npm registry
  try {
    const response = await fetch(`https://registry.npmjs.org/${pkg.name}`)
    const data = await response.json()

    // Initialize result
    const result: DeprecatedInfo = {
      current: {
        deprecated: false,
      },
      last: {
        deprecated: false,
      },
    }

    // Get all versions and sort them by semver
    const versions = Object.keys(data.versions || {})
    const semverSort = (a: string, b: string) => {
      const aParts = a.split('.').map(Number)
      const bParts = b.split('.').map(Number)

      for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i]
        }
      }
      return 0
    }
    const sortedVersions = versions.sort(semverSort)

    // 1. Check if the current version is deprecated
    const currentVersionInfo = data.versions?.[pkg.version]
    if (currentVersionInfo?.deprecated) {
      result.current.deprecated = true
      result.current.message = currentVersionInfo.deprecated
    }

    // 2. Get the last version by semver and check if it's deprecated
    if (sortedVersions.length > 0) {
      const lastVersion = sortedVersions[sortedVersions.length - 1]
      const lastVersionInfo = data.versions?.[lastVersion]

      if (lastVersionInfo?.deprecated) {
        result.last.deprecated = true
        result.last.message = lastVersionInfo.deprecated
      }
    }

    // Cache the result
    await fs.writeFile(cacheFile, JSON.stringify(result, null, 2), 'utf-8')

    return result
  }
  catch {
    // If there's an error fetching data, return a default value
    return {
      current: { deprecated: false },
      last: { deprecated: false },
    }
  }
}

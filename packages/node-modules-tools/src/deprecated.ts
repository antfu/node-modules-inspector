import type { PackageNodeRaw } from './types'
import { existsSync, mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import { join } from 'pathe'

export interface DeprecatedInfo {
  deprecated: boolean
  willbedeprecated?: {
    version: string
    message: string
    timeAfterCurrent: number
    versionsCount: number
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
  if (pkg.workspace)
    return { deprecated: false }
  if (pkg.name.startsWith('#'))
    return { deprecated: false }
  if (pkg.version.match(/^(?:file|link|workspace):/))
    return { deprecated: false }

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
      deprecated: false,
    }

    // Check if the current version is deprecated
    const currentVersionInfo = data.versions?.[pkg.version]
    if (currentVersionInfo?.deprecated) {
      result.deprecated = true
    }

    // Check for future deprecations
    const versions = Object.keys(data.versions || {})
    // Sort versions to find the next version after the current one
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
    const currentVersionIndex = sortedVersions.indexOf(pkg.version)

    if (currentVersionIndex !== -1 && currentVersionIndex < sortedVersions.length - 1) {
      // Get the latest version
      const latestVersion = sortedVersions[sortedVersions.length - 1]

      // Check if the latest version is deprecated
      const isLatestDeprecated = !!data.versions[latestVersion]?.deprecated

      // Only proceed if the latest version is deprecated
      if (isLatestDeprecated) {
        // Find the last deprecated version after the current one
        let lastDeprecatedVersion: string | null = null
        let lastDeprecatedVersionIndex = -1

        // Get the publication date of the current version
        const currentVersionDate = new Date(data.time?.[pkg.version] || 0)

        // Check all future versions for deprecation
        for (let i = currentVersionIndex + 1; i < sortedVersions.length; i++) {
          const version = sortedVersions[i]
          const versionDate = new Date(data.time?.[version] || 0)

          // Only consider versions published after the current version
          if (data.versions[version]?.deprecated && versionDate > currentVersionDate) {
            lastDeprecatedVersion = version
            lastDeprecatedVersionIndex = i
          }
        }

        // If we found a deprecated version after the current one
        if (lastDeprecatedVersion && lastDeprecatedVersionIndex !== -1) {
          const version = lastDeprecatedVersion
          // Get the publication date of the deprecated version
          const deprecatedVersionDate = new Date(data.time?.[version] || 0)

          // Calculate days difference (if dates are available)
          const daysDifference = currentVersionDate.getTime() && deprecatedVersionDate.getTime()
            ? Math.floor((deprecatedVersionDate.getTime() - currentVersionDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0

          // Only consider it as "will be deprecated" if the days difference is positive
          if (daysDifference > 0) {
            const versionsCount = lastDeprecatedVersionIndex - currentVersionIndex

            result.willbedeprecated = {
              version,
              message: data.versions[version].deprecated,
              timeAfterCurrent: daysDifference,
              versionsCount,
            }
          }
        }
      }
    }

    // Cache the result
    await fs.writeFile(cacheFile, JSON.stringify(result, null, 2), 'utf-8')

    return result
  }
  catch {
    // If there's an error fetching data, return a default value
    return { deprecated: false }
  }
}

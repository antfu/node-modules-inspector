import type { PackageNodeRaw } from './types'

export interface DeprecatedInfo {
  current: {
    deprecated?: string
  }
  last: {
    deprecated?: string
    version?: string
  }
}

/**
 * Get deprecated information for a package
 * This will check if the package is deprecated in the npm registry using npm.antfu.dev
 */
export async function getPackageDeprecatedInfo(
  pkg: PackageNodeRaw,
): Promise<DeprecatedInfo> {
  if (pkg.workspace) {
    return {
      current: {},
      last: {},
    }
  }
  if (pkg.name.startsWith('#')) {
    return {
      current: {},
      last: {},
    }
  }
  if (pkg.version.match(/^(?:file|link|workspace):/)) {
    return {
      current: {},
      last: {},
    }
  }

  // Fetch package data from npm.antfu.dev
  try {
    const response = await fetch(`https://npm.antfu.dev/${pkg.name}@${pkg.version}+${pkg.name}?metadata=true`)
    const data = await response.json()

    // Initialize result
    const result: DeprecatedInfo = {
      current: {},
      last: {},
    }

    // Process the response data
    if (data && Array.isArray(data) && data.length >= 2) {
      // First item is the current version
      const currentVersionInfo = data[0]
      if (currentVersionInfo?.deprecated) {
        result.current.deprecated = currentVersionInfo.deprecated
      }

      // Second item is the latest version
      const latestVersionInfo = data[1]
      if (latestVersionInfo) {
        result.last.version = latestVersionInfo.version
        if (latestVersionInfo.deprecated) {
          result.last.deprecated = latestVersionInfo.deprecated
        }
      }
    }

    return result
  }
  catch {
    // If there's an error fetching data, return a default value
    return {
      current: {},
      last: {},
    }
  }
}

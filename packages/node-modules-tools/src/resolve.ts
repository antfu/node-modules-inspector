import type { AgentName } from 'package-manager-detector'
import type { PackageJson } from 'pkg-types'
import type { BaseOptions, PackageNode, PackageNodeBase } from './types'
import fs from 'node:fs/promises'
import { findUp } from 'find-up'
import { join } from 'pathe'
import { parse } from 'yaml'
import { analyzePackageModuleType } from './analyze-esm'
import { getPackageInstallSize } from './size'

// Cache for workspace catalog data
let workspaceCatalogCache: {
  catalog?: Record<string, string>
  catalogs?: Record<string, Record<string, string>>
} | null = null

// Function to get catalog information for a package
async function getCatalogForPackage(packageName: string): Promise<string | undefined> {
  // Load and cache workspace catalog data if not already loaded
  if (workspaceCatalogCache === null) {
    try {
      const workspaceYamlPath = await findUp('pnpm-workspace.yaml')
      if (workspaceYamlPath) {
        const content = await fs.readFile(workspaceYamlPath, 'utf-8')
        const workspaceData = parse(content)
        workspaceCatalogCache = {
          catalog: workspaceData.catalog,
          catalogs: workspaceData.catalogs,
        }
      }
      else {
        workspaceCatalogCache = {}
      }
    }
    catch (error) {
      console.error('Error loading pnpm-workspace.yaml:', error)
      workspaceCatalogCache = {}
    }
  }

  // First check if package is in a named catalog (higher priority)
  if (workspaceCatalogCache.catalogs) {
    for (const [catalogName, packages] of Object.entries(workspaceCatalogCache.catalogs)) {
      const packageKeys = Object.keys(packages)
      if (packageKeys.includes(packageName)) {
        return catalogName
      }
    }
  }

  // Then check if package is in the default catalog (lower priority)
  if (workspaceCatalogCache.catalog && packageName in workspaceCatalogCache.catalog) {
    return 'default'
  }

  return undefined
}

/**
 * Analyze a package node, and return a resolved package node.
 * This function mutates the input package node.
 *
 * - Set `module` to the resolved module type (cjs, esm, dual, faux, none).
 */
export async function resolvePackage(
  _packageManager: AgentName,
  pkg: PackageNodeBase,
  _options: BaseOptions,
): Promise<PackageNode> {
  const _pkg = pkg as unknown as PackageNode
  if (_pkg.resolved)
    return _pkg
  const content = await fs.readFile(join(pkg.filepath, 'package.json'), 'utf-8')
  const json = JSON.parse(stripBomTag(content)) as PackageJson

  let repository = (typeof json.repository === 'string' ? json.repository : json.repository?.url)
  if (repository?.startsWith('git+'))
    repository = repository.slice(4)
  if (repository?.endsWith('.git'))
    repository = repository.slice(0, -4)
  if (repository?.startsWith('git://'))
    repository = `https://${repository.slice(6)}`
  if (json.repository && typeof json.repository !== 'string' && json.repository.directory)
    repository += `/tree/HEAD/${json.repository.directory}`

  let funding = json.funding
  if (typeof funding === 'string')
    funding = { url: funding }

  // Extract org from package name
  let org: string | undefined
  const parts = pkg.name.split('/')
  if (parts.length > 1) {
    org = parts[0]
  }

  // Get catalog information for the package
  const catalog = await getCatalogForPackage(pkg.name)

  _pkg.resolved = {
    module: analyzePackageModuleType(json),
    engines: json.engines,
    license: json.license,
    author: typeof json.author === 'string' ? json.author : json.author?.url,
    funding,
    repository,
    homepage: json.homepage,
    installSize: await getPackageInstallSize(_pkg),
    org,
    catalog,
  }
  return _pkg
}

// strip UTF-8 BOM
// copied from https://github.com/vitejs/vite/blob/90f1420430d7eff45c1e00a300fb0edd972ee0df/packages/vite/src/node/utils.ts#L1322
function stripBomTag(content: string): string {
  // eslint-disable-next-line unicorn/number-literal-case
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }

  return content
}

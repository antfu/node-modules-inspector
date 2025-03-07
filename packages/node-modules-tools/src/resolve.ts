import type { AgentName } from 'package-manager-detector'
import type { PackageJson } from 'pkg-types'
import type { BaseOptions, PackageNode, PackageNodeBase } from './types'
import fs from 'node:fs/promises'
import { join } from 'pathe'
import { analyzePackageModuleType } from './analyze-esm'
import { getPackageDeprecatedInfo } from './deprecated'
import { getPackageInstallSize } from './size'

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

  type RawFunding = string | { url: string, type?: string }
  const rawFunding: RawFunding | RawFunding[] | undefined = json.funding
  let fundings: { url: string, type?: string }[]
  if (typeof rawFunding === 'string') {
    fundings = [{ url: rawFunding }]
  }
  else if (Array.isArray(rawFunding)) {
    fundings = rawFunding.map(f => typeof f === 'string' ? { url: f } : f)
  }
  else {
    fundings = rawFunding ? [rawFunding] : []
  }

  const deprecatedInfo = await getPackageDeprecatedInfo(_pkg)
  if (deprecatedInfo.deprecated) {
    console.warn(
      `Package "${pkg.name}@${pkg.version}":\n`
      + `${JSON.stringify(deprecatedInfo, null, 2)}\n`,
    )
  }

  _pkg.resolved = {
    module: analyzePackageModuleType(json),
    engines: json.engines,
    license: json.license,
    author: typeof json.author === 'string' ? json.author : json.author?.url,
    fundings,
    exports: json.exports,
    repository,
    homepage: json.homepage,
    installSize: await getPackageInstallSize(_pkg),
    deprecatedInfo,
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

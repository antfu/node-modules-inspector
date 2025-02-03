import type { PackageJson } from 'pkg-types'
import type { PackageNode, PackageNodeBase } from './types'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import { analyzePackageModuleType } from './analyze-esm'
import { stripBomTag } from './utils'

/**
 * Analyze a package node, and return a resolved package node.
 * This function mutates the input package node.
 *
 * - Set `module` to the resolved module type (cjs, esm, dual, faux, none).
 */
export async function resolvePackage(pkg: PackageNodeBase): Promise<PackageNode> {
  const _pkg = pkg as unknown as PackageNode
  if (_pkg.resolved)
    return _pkg
  const content = await fs.readFile(join(pkg.filepath, 'package.json'), 'utf-8')
  const json = JSON.parse(stripBomTag(content)) as PackageJson
  _pkg.resolved = {
    module: analyzePackageModuleType(json),
    engines: json.engines,
    license: json.license,
    author: typeof json.author === 'string' ? json.author : json.author?.url,
    repository: typeof json.repository === 'string' ? json.repository : json.repository?.url,
  }
  return _pkg
}

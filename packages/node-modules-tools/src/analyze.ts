import type { PackageJson } from 'pkg-types'
import type { PackageNode, ResolvedPackageNode } from './types'
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
export async function analyzePackage(pkg: PackageNode): Promise<ResolvedPackageNode> {
  const _pkg = pkg as unknown as ResolvedPackageNode
  if (_pkg.resolved)
    return _pkg
  const content = await fs.readFile(join(pkg.path, 'package.json'), 'utf-8')
  const json = JSON.parse(stripBomTag(content)) as PackageJson
  _pkg.resolved = {
    module: analyzePackageModuleType(json),
    engines: json.engines,
  }
  return _pkg
}

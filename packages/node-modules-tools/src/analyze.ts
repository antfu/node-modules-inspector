import type { PackageNode, ResolvedPackageNode } from './types'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import { analyzePackageJson } from './analyze-esm'
import { stripBomTag } from './utils'

/**
 * Analyze a package node, and return a resolved package node.
 * This function mutates the input package node.
 *
 * - Set `module` to the resolved module type (cjs, esm, dual, faux).
 */
export async function analyzePackage(pkg: PackageNode): Promise<ResolvedPackageNode> {
  const _pkg = pkg as unknown as ResolvedPackageNode
  if (_pkg.module)
    return _pkg
  const content = await fs.readFile(join(pkg.path, 'package.json'), 'utf-8')
  const json = JSON.parse(stripBomTag(content))
  _pkg.module = analyzePackageJson(json)
  return _pkg
}

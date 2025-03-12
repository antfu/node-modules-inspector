import type { AgentName } from 'package-manager-detector'
import type { PackageJson } from 'pkg-types'
import type { BaseOptions, PackageNode, PackageNodeBase } from './types'
import fs from 'node:fs/promises'
import { objectPick } from '@antfu/utils'
import { join } from 'pathe'
import { analyzePackageModuleType } from './analyze-esm'
import { getPackageInstallSize } from './size'

// @keep-unique
// @keep-sorted
export const PACKAGE_JSON_KEYS = [
  'author',
  'authors',
  'bin',
  'bugs',
  'dependencies',
  'description',
  'devDependencies',
  'engines',
  'exports',
  'funding',
  'fundings',
  'homepage',
  'imports',
  'keywords',
  'license',
  'main',
  'module',
  'name',
  'optionalDependencies',
  'repository',
  'types',
  'version',
] satisfies (keyof PackageJson)[]

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

  _pkg.resolved = {
    module: analyzePackageModuleType(json),
    packageJson: objectPick(json, PACKAGE_JSON_KEYS),
    installSize: await getPackageInstallSize(_pkg),
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

import type { AgentName } from 'package-manager-detector'
import type { PackageJson } from 'pkg-types'
import type { BaseOptions, PackageNode, PackageNodeBase } from './types'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'pathe'
import { resolvePackageJsonFields } from './resolve-json'
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

  const path = join(pkg.filepath, 'package.json')
  if (existsSync(path)) {
    // In cases like optional dependencies, the package might not be installed.
    const content = await readFile(path, 'utf-8')
    const json = JSON.parse(stripBomTag(content)) as PackageJson

    _pkg.resolved = {
      ...resolvePackageJsonFields(json),
      installSize: await getPackageInstallSize(_pkg),
    }
  }
  else {
    _pkg.filepath = ''
    _pkg.resolved = {
      module: 'unknown',
      packageJson: {},
    }
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

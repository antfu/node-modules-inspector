import type { PackageInstallSizeInfo, PackageNodeRaw } from './types'
import fs from 'node:fs/promises'
import { join } from 'node:path'

export async function getPackageInstallSize(
  pkg: PackageNodeRaw,
): Promise<PackageInstallSizeInfo | undefined> {
  if (pkg.workspace)
    return
  if (pkg.name.startsWith('#'))
    return
  if (pkg.version.match(/^(?:file|link|workspace):/))
    return

  const root = pkg.filepath

  const files: string[] = []

  async function traverse(dir: string) {
    for (const n of await fs.readdir(dir, { withFileTypes: true })) {
      if (n.isFile()) {
        files.push(join(dir, n.name))
      }
      else if (n.isDirectory()) {
        if (n.name.match(/^\.|^node_modules$/))
          continue
        await traverse(join(dir, n.name))
      }
    }
  }

  await traverse(root)

  const sizes = await Promise.all(files.map(getSingleFileSize))
  const bytes = sizes.reduce((acc, size) => acc + size, 0)
  return {
    bytes,
  }
}

async function getSingleFileSize(file: string) {
  try {
    const stats = await fs.stat(file)
    return stats.size
  }
  catch {
    return 0
  }
}

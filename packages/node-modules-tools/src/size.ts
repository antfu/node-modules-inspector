import type { PackageInstallSizeInfo, PackageNodeRaw } from './types'
import fs from 'node:fs/promises'
import { join, relative } from 'node:path'

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

  const types = files.map(f => guessFileType(relative(root, f)))
  const fileTypes: PackageInstallSizeInfo['fileTypes'] = {}
  const sizes = await Promise.all(files.map(getSingleFileSize))

  let bytes = 0
  for (let i = 0; i < files.length; i++) {
    bytes += sizes[i]
    const type = types[i]
    if (!fileTypes[type])
      fileTypes[type] = { bytes: 0, count: 0 }
    fileTypes[type].bytes += sizes[i]
    fileTypes[type].count += 1
  }

  return {
    bytes,
    fileTypes,
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

export function guessFileType(file: string) {
  const parts = file.split(/\/|\\/g)
  const dirs = parts.slice(0, -1)
  const base = parts.at(-1)!

  if (dirs.some(d => d.match(/^(?:test|tests|__tests__)$/)))
    return 'test'
  if (dirs.some(d => d.match(/^\.\w/)) || base.startsWith('.'))
    return 'dotfile'

  if (base.match(/\.(?:test|tests|spec|specs)\.\w+$/i))
    return 'test'
  if (base.match(/\.d(\.\w+)?\.[cm]?tsx?$/i))
    return 'types'
  if (base.match(/\.(?:css|scss|sass|less)$/i))
    return 'css'
  if (base.match(/\.json[c5]?$/i))
    return 'json'
  if (base.match(/\.ya?ml$/i))
    return 'yaml'
  if (base.match(/\.html?$/i))
    return 'html'
  if (base.match(/\.[cm]?jsx?$/i))
    return 'js'
  if (base.match(/\.[cm]?tsx?$/i))
    return 'ts'
  if (base.match(/\.(?:vue|svelte|astro)$/i))
    return 'component'
  if (base.match(/\.(?:png|jpe?g|gif|svg)$/i))
    return 'image'
  if (base.match(/\.(?:md|txt|mdx|markdown|rst)$/i))
    return 'doc'
  return 'others'
}

import type { FileCategory, PackageInstallSizeInfo, PackageNodeRaw } from './types'
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

  const types = files.map(f => guessFileCategory(relative(root, f)))
  const categories: PackageInstallSizeInfo['categories'] = {}
  const sizes = await Promise.all(files.map(getSingleFileSize))

  let bytes = 0
  for (let i = 0; i < files.length; i++) {
    bytes += sizes[i]
    const type = types[i]
    if (!categories[type])
      categories[type] = { bytes: 0, count: 0 }
    categories[type].bytes += sizes[i]
    categories[type].count += 1
  }

  return {
    bytes,
    categories,
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

export function guessFileCategory(file: string): FileCategory {
  const parts = file.split(/\/|\\/g)
  const dirs = parts.slice(0, -1)
  const base = parts.at(-1)!

  if (dirs.some(d => d.match(/^(?:test|tests|__tests__)$/)))
    return 'test'
  if (dirs.some(d => d.match(/^\.\w/)) || base.startsWith('.'))
    return 'other'
  if (dirs.some(d => d.match(/^(?:bin|binary)$/)))
    return 'bin'

  if (base.match(/\.(?:test|tests|spec|specs)\.\w+$/i))
    return 'test'
  if (base.match(/\.map$/i))
    return 'map'
  if (base.match(/\.d(\.\w+)?\.[cm]?tsx?$/i))
    return 'dts'
  if (base.match(/\.exe$/i))
    return 'bin'
  if (base.match(/\.(?:css|scss|sass|less)$/i))
    return 'css'
  if (base.match(/\.(?:json[c5]?|ya?ml)$/i))
    return 'json'
  if (base.match(/\.html?$/i))
    return 'html'
  if (base.match(/\.[cm]?jsx?$/i))
    return 'js'
  if (base.match(/\.[cm]?tsx?$/i))
    return 'ts'
  if (base.match(/\.(?:vue|svelte|astro)$/i))
    return 'comp'
  if (base.match(/\.(?:png|jpe?g|gif|svg)$/i))
    return 'image'
  if (base.match(/\.(?:md|txt|mdx|markdown|rst)$/i))
    return 'doc'
  if (base.match(/\.(?:wasm|wat)$/i))
    return 'wasm'
  if (base.match(/\.flow$/i))
    return 'flow'
  if (base.match(/\.(?:ttf|otf|woff2?)$/i))
    return 'font'
  return 'other'
}

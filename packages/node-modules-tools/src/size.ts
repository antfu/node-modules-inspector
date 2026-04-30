import type { FileCategory, PackageInstallSizeInfo, PackageNodeRaw } from './types'
import fs from 'node:fs/promises'
import { join, relative } from 'node:path'

export async function getPackageInstallSize(
  pkg: PackageNodeRaw,
): Promise<PackageInstallSizeInfo | undefined> {
  if (pkg.workspace || !pkg.name || !pkg.version)
    return
  if (pkg.name.startsWith('#'))
    return
  if (/^(?:file|link|workspace):/.test(pkg.version))
    return
  if (!pkg.filepath)
    return

  const root = pkg.filepath
  const files: string[] = []

  async function traverse(dir: string) {
    for (const n of await fs.readdir(dir, { withFileTypes: true })) {
      if (n.isFile()) {
        files.push(join(dir, n.name))
      }
      else if (n.isDirectory()) {
        if (/^\.|^node_modules$/.test(n.name))
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
    bytes += sizes[i]!
    const type = types[i]!
    if (!categories[type])
      categories[type] = { bytes: 0, count: 0 }
    categories[type].bytes += sizes[i]!
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

  if (/\.(?:test|tests|spec|specs)\.\w+$/i.test(base))
    return 'test'
  if (/\.map$/i.test(base))
    return 'map'
  if (/\.d(?:\.\w+)?\.[cm]?tsx?$/i.test(base))
    return 'dts'
  if (/\.exe$/i.test(base))
    return 'bin'
  if (/\.(?:css|scss|sass|less)$/i.test(base))
    return 'css'
  if (/\.(?:json[c5]?|ya?ml)$/i.test(base))
    return 'json'
  if (/\.html?$/i.test(base))
    return 'html'
  if (/\.[cm]?jsx?$/i.test(base))
    return 'js'
  if (/\.[cm]?tsx?$/i.test(base))
    return 'ts'
  if (/\.(?:vue|svelte|astro)$/i.test(base))
    return 'comp'
  if (/\.(?:png|jpe?g|gif|svg)$/i.test(base))
    return 'image'
  if (/\.(?:md|txt|mdx|markdown|rst)$/i.test(base))
    return 'doc'
  if (/\.(?:wasm|wat)$/i.test(base))
    return 'wasm'
  if (/\.flow$/i.test(base))
    return 'flow'
  if (/\.(?:ttf|otf|woff2?)$/i.test(base))
    return 'font'
  return 'other'
}

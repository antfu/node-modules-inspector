import fs from 'node:fs'
import { join } from 'pathe'

// Mirrors `depPathToFilename` from pnpm (and aube's port of it):
// `@scope/pkg@1.0.0` -> `@scope+pkg@1.0.0`,
// `react-dom@18.3.1(react@18.3.1)` -> `react-dom@18.3.1_react@18.3.1`,
// nested peers `a@1(b@2(c@3))` -> `a@1_b@2_c@3`.
//
// The reference implementations additionally append a hash suffix once the
// name exceeds the virtual store dir max length or contains uppercase
// characters. Those cases are covered by the directory scan in
// `createVirtualStoreResolver` instead of reimplementing the hash here.
const FORBIDDEN_CHARS = /[\\/:*?"<>|#]/g

export function depPathToDirName(depPath: string): string {
  if (depPath.startsWith('file:'))
    depPath = `file+${depPath.slice(5)}`
  else if (depPath.startsWith('/'))
    depPath = depPath.slice(1)

  const name = depPath.replace(FORBIDDEN_CHARS, '+')
  if (!name.includes('('))
    return name

  const flat = name.endsWith(')') ? name.slice(0, -1) : name
  return flat.replace(/\)\(/g, '_').replace(/[()]/g, '_')
}

/**
 * Resolve the on-disk directory of an installed package.
 *
 * aube and nub both use a pnpm-style isolated layout, where a package lives at
 * `node_modules/<virtual store>/<dep path>/node_modules/<name>`. The virtual
 * store directory (`node_modules/.aube`, `node_modules/.store`, ...) is a list
 * so a single resolver can serve both package managers.
 */
export function createVirtualStoreResolver(
  root: string,
  virtualStoreDirs: string[],
): (name: string, version: string) => string | undefined {
  const storeEntries = new Map<string, string[]>()

  function listStoreEntries(dirName: string): string[] {
    const cached = storeEntries.get(dirName)
    if (cached)
      return cached

    const dir = join(root, 'node_modules', dirName)
    let entries: string[] = []
    if (fs.existsSync(dir)) {
      try {
        entries = fs.readdirSync(dir)
      }
      catch {
        entries = []
      }
    }
    storeEntries.set(dirName, entries)
    return entries
  }

  return (name, version) => {
    const dirName = depPathToDirName(`${name}@${version}`)

    for (const storeName of virtualStoreDirs) {
      const storeDir = join(root, 'node_modules', storeName)

      const exact = join(storeDir, dirName, 'node_modules', name)
      if (fs.existsSync(exact))
        return exact

      // Peer-suffixed (`react-dom@18.3.1_react@18.3.1`) and hashed directory
      // names are matched by prefix.
      const entry = listStoreEntries(storeName)
        .find(i => i === dirName || i.startsWith(`${dirName}_`) || i.startsWith(`${dirName}+`))
      if (entry) {
        const candidate = join(storeDir, entry, 'node_modules', name)
        if (fs.existsSync(candidate))
          return candidate
      }
    }

    // Top level entry - either a hoisted install (`node-linker=hoisted`) or a
    // symlink into a shared virtual store (`enableGlobalVirtualStore`).
    const topLevel = join(root, 'node_modules', name)
    if (fs.existsSync(topLevel))
      return topLevel

    return undefined
  }
}

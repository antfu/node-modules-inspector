import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../../src'

// `aube install --lockfile-only` writes the lockfile without linking
// node_modules, which keeps the fixtures small.

describe('listAubePackageDependencies', () => {
  it('runs with simple fixture', { timeout: 30000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/simple', import.meta.url)),
      depth: 25,
      monorepo: false,
    })

    expect(list.packageManager).toBe('aube')
    expect(list.packageManagerVersion).toBeTypeOf('string')
    expect(list.packages.size).toBe(4)

    const root = list.packages.get('aube-fixture-simple@0.0.0')
    expect(root?.workspace).toBe(true)
    expect(root?.private).toBe(true)
    expect(root?.dependencies.has('debug@4.3.4')).toBe(true)
    expect(root?.dependencies.has('picocolors@1.1.1')).toBe(true)

    const debug = list.packages.get('debug@4.3.4')
    expect(debug?.workspace).toBe(false)
    expect(debug?.clusters.has('dep:prod')).toBe(true)
    expect(debug?.dependencies.has('ms@2.1.2')).toBe(true)

    const ms = list.packages.get('ms@2.1.2')
    // Transitive dependencies inherit the cluster of their dependents
    expect(ms?.clusters.has('dep:prod')).toBe(true)
    expect(ms?.flatDependents.has('debug@4.3.4')).toBe(true)

    const picocolors = list.packages.get('picocolors@1.1.1')
    expect(picocolors?.clusters.has('dep:dev')).toBe(true)
    expect(picocolors?.clusters.has('dep:prod')).toBe(false)
  })

  it('runs with workspace fixture', { timeout: 30000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/workspace', import.meta.url)),
      depth: 25,
      monorepo: true,
    })

    expect(list.packageManager).toBe('aube')

    const workspaceNames = Array.from(list.packages.values())
      .filter(pkg => pkg.workspace)
      .map(pkg => pkg.name)
      .sort()
    expect(workspaceNames).toEqual(['aube-fixture-ws', 'pkg-a', 'pkg-b'])

    const pkgA = list.packages.get('pkg-a@1.0.0')
    expect(pkgA?.dependencies.has('debug@4.3.4')).toBe(true)

    const pkgB = list.packages.get('pkg-b@2.0.0')
    expect(pkgB?.dependencies.has('ms@2.1.3')).toBe(true)
    expect(pkgB?.dependencies.has('picocolors@1.1.1')).toBe(true)

    expect(list.packages.get('debug@4.3.4')?.dependencies.has('ms@2.1.2')).toBe(true)
    expect(list.packages.get('picocolors@1.1.1')?.clusters.has('dep:dev')).toBe(true)
  })

  it('handles a standalone project in monorepo mode', { timeout: 30000 }, async () => {
    // The fixture declares no workspace, so `ls --recursive` has no workspace
    // root to walk; it must not abort the listing.
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/simple', import.meta.url)),
      depth: 25,
      monorepo: true,
    })

    expect(list.packageManager).toBe('aube')
    expect(list.packages.size).toBe(4)

    const workspaceNames = Array.from(list.packages.values())
      .filter(pkg => pkg.workspace)
      .map(pkg => pkg.name)
    expect(workspaceNames).toEqual(['aube-fixture-simple'])
  })

  it('strips peer suffixes from reported versions', { timeout: 30000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/peers', import.meta.url)),
      depth: 25,
      monorepo: false,
    })

    // `aube ls` reports peer-resolved versions (`1.4.0(browserslist@4.29.6)`),
    // which would break registry lookups and spec identity.
    const specs = Array.from(list.packages.keys())
    expect(specs.some(spec => spec.includes('('))).toBe(false)

    const browserslistUpdate = list.packages.get('update-browserslist-db@1.4.0')
    expect(browserslistUpdate?.version).toBe('1.4.0')
  })
})

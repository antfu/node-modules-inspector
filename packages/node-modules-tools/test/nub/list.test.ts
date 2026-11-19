import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../../src'

// `nub install --lockfile-only` writes `nub.lock` without linking
// node_modules, which keeps the fixtures small.
//
// The nub CLI itself is required to read the graph: install it with
// `mise use -g nub` (or see https://nubjs.com/docs/install).
const hasNub = spawnSync('nub', ['--version'], { stdio: 'ignore' }).status === 0

describe('listNubPackageDependencies', () => {
  it.skipIf(!hasNub)('runs with simple fixture', { timeout: 30000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/simple', import.meta.url)),
      depth: 25,
      monorepo: false,
    })

    expect(list.packageManager).toBe('nub')
    expect(list.packageManagerVersion).toBeTypeOf('string')
    expect(list.packages.size).toBe(4)

    const root = list.packages.get('nub-fixture-simple@0.0.0')
    expect(root?.workspace).toBe(true)
    expect(root?.private).toBe(true)
    expect(root?.dependencies.has('debug@4.3.4')).toBe(true)
    expect(root?.dependencies.has('picocolors@1.1.1')).toBe(true)

    const debug = list.packages.get('debug@4.3.4')
    expect(debug?.workspace).toBe(false)
    expect(debug?.clusters.has('dep:prod')).toBe(true)
    expect(debug?.dependencies.has('ms@2.1.2')).toBe(true)

    const ms = list.packages.get('ms@2.1.2')
    expect(ms?.clusters.has('dep:prod')).toBe(true)
    expect(ms?.flatDependents.has('debug@4.3.4')).toBe(true)

    const picocolors = list.packages.get('picocolors@1.1.1')
    expect(picocolors?.clusters.has('dep:dev')).toBe(true)
    expect(picocolors?.clusters.has('dep:prod')).toBe(false)
  })

  it.skipIf(!hasNub)('runs with workspace fixture', { timeout: 30000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/workspace', import.meta.url)),
      depth: 25,
      monorepo: true,
    })

    expect(list.packageManager).toBe('nub')

    const workspaceNames = Array.from(list.packages.values())
      .filter(pkg => pkg.workspace)
      .map(pkg => pkg.name)
      .sort()
    expect(workspaceNames).toEqual(['nub-fixture-ws', 'pkg-a', 'pkg-b'])

    const pkgA = list.packages.get('pkg-a@1.0.0')
    expect(pkgA?.dependencies.has('debug@4.3.4')).toBe(true)

    const pkgB = list.packages.get('pkg-b@2.0.0')
    expect(pkgB?.dependencies.has('ms@2.1.3')).toBe(true)

    expect(list.packages.get('debug@4.3.4')?.dependencies.has('ms@2.1.2')).toBe(true)
  })
})

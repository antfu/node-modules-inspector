import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../../src'

describe('listPnpmPackageDependencies', () => {
  it('runs with multiple package.json files', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/multiple-package-jsons', import.meta.url)),
      depth: 25,
      monorepo: true,
      workspace: false,
    })

    expect(list.packageManager).toBe('pnpm')
    expect(list.packages.size).toBe(2)
  })

  it('runs on a fixture with installed deps', { timeout: 10000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/with-installed-deps', import.meta.url)),
      depth: 25,
      monorepo: false,
      workspace: false,
    })

    expect(list.packageManager).toBe('pnpm')
    expect(list.packageManagerVersion).toBeTypeOf('string')

    const debug = list.packages.get('debug@4.3.4')
    expect(debug).toBeDefined()
    expect(debug?.name).toBe('debug')
    expect(debug?.version).toBe('4.3.4')
    expect(debug?.workspace).toBeFalsy()
    expect(debug?.clusters.has('dep:prod')).toBe(true)
    expect(debug?.dependencies.has('ms@2.1.2')).toBe(true)
    expect(debug?.resolved.license).toBe('MIT')
    expect(debug?.resolved.packageJson?.name).toBe('debug')
    expect(debug?.resolved.repository?.repoName).toBe('debug')
    expect(debug?.resolved.authors?.length).toBeGreaterThan(0)
    expect(debug?.resolved.installSize?.bytes).toBeGreaterThan(0)

    const ms = list.packages.get('ms@2.1.2')
    expect(ms).toBeDefined()
    expect(ms?.name).toBe('ms')
    expect(ms?.version).toBe('2.1.2')

    expect(Array.from(debug?.flatDependents ?? [])).toContain('pnpm-fixture-with-installed-deps@0.0.0')
  })
})

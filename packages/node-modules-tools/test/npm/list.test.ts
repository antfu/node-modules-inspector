import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../../src'

describe('listNpmPackageDependencies', () => {
  it('runs with multiple package.json files', { timeout: 30000 }, async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/multiple-package-jsons', import.meta.url)),
      depth: 25,
      monorepo: true,
      workspace: false,
    })

    expect(list.packageManager).toBe('npm')
    expect(list.packages.size).toBe(2)
  })

  it('ignores leftover directories npm fails to clean up', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/broken-install', import.meta.url)),
      depth: 25,
      monorepo: true,
      workspace: false,
    })

    expect(list.packageManager).toBe('npm')
    expect(list.packages.size).toBe(2)
    expect(Array.from(list.packages.values()).every(i => i.name)).toBe(true)
  })

  it('handles a root package.json missing name/version', async () => {
    const list = await listPackageDependencies({
      cwd: fileURLToPath(new URL('./fixtures/root-missing-version', import.meta.url)),
      depth: 25,
      monorepo: true,
      workspace: false,
    })

    expect(list.packageManager).toBe('npm')
    expect(list.packages.size).toBe(2)

    const root = Array.from(list.packages.values()).find(i => i.workspace && i.name !== 'child-package-json')
    expect(root).toBeDefined()
    expect(root!.name).toBeTruthy()
    expect(root!.version).toBe('0.0.0')

    const child = Array.from(list.packages.values()).find(i => i.name === 'child-package-json')
    expect(child).toBeDefined()
    expect(child!.version).toBe('1.0.0')
  })
})

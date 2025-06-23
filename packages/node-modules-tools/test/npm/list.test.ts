import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { listPackageDependencies } from '../../src'

describe('listNpmPackageDependencies', () => {
  it('runs with multiple package.json files', async () => {
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
})

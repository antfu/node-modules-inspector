import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findRushRoot, isRushMonorepo } from './rush'

describe('rush detection', () => {
  function createTempDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'rush-test-'))
  }

  it('returns false when no rush.json exists', () => {
    const dir = createTempDir()
    expect(isRushMonorepo(dir)).toBe(false)
    expect(findRushRoot(dir)).toBeUndefined()
  })

  it('detects rush.json at the current directory', () => {
    const dir = createTempDir()
    fs.writeFileSync(path.join(dir, 'rush.json'), '{}')
    expect(isRushMonorepo(dir)).toBe(true)
    expect(findRushRoot(dir)).toBe(dir)
  })

  it('detects rush.json in a parent directory', () => {
    const root = createTempDir()
    fs.writeFileSync(path.join(root, 'rush.json'), '{}')
    const child = path.join(root, 'apps', 'web')
    fs.mkdirSync(child, { recursive: true })

    expect(isRushMonorepo(child)).toBe(true)
    expect(findRushRoot(child)).toBe(root)
  })

  it('distinguishes rush.json from pnpm-workspace.yaml', () => {
    const dir = createTempDir()
    fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages: []')
    expect(isRushMonorepo(dir)).toBe(false)
  })
})

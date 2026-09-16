import type { PackageJson } from 'pkg-types'
import { describe, expect, it } from 'vitest'
import { packageJsonSnapshots } from '../test/fixtures/package-json-snapshots'
import { analyzePackageModuleType } from './analyze-esm'

function analyze(pkgJson: Partial<PackageJson>) {
  return analyzePackageModuleType(pkgJson as PackageJson)
}

function nestExports(depth: number, value: unknown): any {
  let nested = value
  for (let i = 0; i < depth; i++)
    nested = { default: nested }
  return nested
}

describe('analyzePackageModuleType', () => {
  for (const [name, fixture] of Object.entries(packageJsonSnapshots)) {
    it(name, () => {
      expect(analyze(fixture.packageJson)).toBe(fixture.expected)
    })
  }

  it('stops recursive export analysis after max depth', () => {
    expect(analyze({
      exports: nestExports(11, './index.mjs'),
    })).toBe('unknown')
  })

  it('handles main: false without crashing', () => {
    // Some packages (e.g. math-intrinsics, dunder-proto) declare "main": false
    // to indicate exports-only packages. Should not crash.
    expect(analyze({
      name: 'math-intrinsics',
      main: false as any,
      exports: { './abs': './abs.js' },
    })).toBe('unknown')
  })
})

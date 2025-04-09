import type { PackageJson } from 'pkg-types'
import { describe, expect, it } from 'vitest'
import { normalizePkgLicense } from './package-json'

describe('normalize', () => {
  describe('normalizePkgLicense', () => {
    it('should parse legacy object format', () => {
      expect(normalizePkgLicense({ license: { type: 'MIT', url: 'dontcare' } } as unknown as PackageJson)).toMatchInlineSnapshot(`"MIT"`)
    })
    it('should parse legacy array format', () => {
      expect(normalizePkgLicense({ licenses: [] } as unknown as PackageJson)).toMatchInlineSnapshot(`undefined`)
      expect(normalizePkgLicense({ licenses: [{ type: 'MIT', url: 'dontcare' }] } as unknown as PackageJson)).toMatchInlineSnapshot(`"MIT"`)
      expect(normalizePkgLicense({ licenses: [{ type: 'MIT', url: 'dontcare' }, { type: 'ISC', url: 'dontcare' }] } as unknown as PackageJson)).toMatchInlineSnapshot(`"(MIT OR ISC)"`)
    })
  })
})

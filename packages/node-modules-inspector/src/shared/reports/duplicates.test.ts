import type { PackageNode } from 'node-modules-tools'
import { describe, expect, it } from 'vitest'
import { computeDuplicates } from './duplicates'

function pkg(name: string, version: string): PackageNode {
  return {
    name,
    version,
    spec: `${name}@${version}`,
  } as unknown as PackageNode
}

describe('computeDuplicates', () => {
  it('returns empty when no duplicates', () => {
    expect(computeDuplicates([pkg('a', '1.0.0'), pkg('b', '1.0.0')])).toEqual([])
  })

  it('groups by name and sorts versions ascending', () => {
    const result = computeDuplicates([
      pkg('a', '2.0.0'),
      pkg('a', '1.0.0'),
      pkg('b', '1.0.0'),
    ])
    expect(result).toEqual([
      { name: 'a', versions: ['1.0.0', '2.0.0'], specs: ['a@1.0.0', 'a@2.0.0'] },
    ])
  })

  it('sorts entries by version count descending', () => {
    const result = computeDuplicates([
      pkg('a', '1.0.0'),
      pkg('a', '2.0.0'),
      pkg('b', '1.0.0'),
      pkg('b', '2.0.0'),
      pkg('b', '3.0.0'),
    ])
    expect(result.map(e => e.name)).toEqual(['b', 'a'])
  })

  it('respects minVersions threshold', () => {
    const packages = [
      pkg('a', '1.0.0'),
      pkg('a', '2.0.0'),
      pkg('b', '1.0.0'),
      pkg('b', '2.0.0'),
      pkg('b', '3.0.0'),
    ]
    expect(computeDuplicates(packages, { minVersions: 3 })).toEqual([
      { name: 'b', versions: ['1.0.0', '2.0.0', '3.0.0'], specs: ['b@1.0.0', 'b@2.0.0', 'b@3.0.0'] },
    ])
  })

  it('respects limit', () => {
    const packages = [
      pkg('a', '1.0.0'),
      pkg('a', '2.0.0'),
      pkg('b', '1.0.0'),
      pkg('b', '2.0.0'),
      pkg('c', '1.0.0'),
      pkg('c', '2.0.0'),
    ]
    expect(computeDuplicates(packages, { limit: 2 })).toHaveLength(2)
  })
})

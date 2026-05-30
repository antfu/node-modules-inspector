import type { PackageNode } from 'node-modules-tools'
import { describe, expect, it } from 'vitest'
import { computeInstallSizes } from './sizes'

interface PkgInput {
  name: string
  version: string
  bytes?: number
  workspace?: boolean
}

function pkg(input: PkgInput): PackageNode {
  return {
    name: input.name,
    version: input.version,
    spec: `${input.name}@${input.version}`,
    workspace: input.workspace,
    resolved: {
      installSize: input.bytes != null
        ? { bytes: input.bytes, categories: { js: { bytes: input.bytes, count: 1 } } }
        : undefined,
    },
  } as unknown as PackageNode
}

describe('computeInstallSizes', () => {
  it('filters out packages without installSize', () => {
    const result = computeInstallSizes([
      pkg({ name: 'a', version: '1.0.0', bytes: 100 }),
      pkg({ name: 'b', version: '1.0.0' }),
    ])
    expect(result.map(e => e.name)).toEqual(['a'])
  })

  it('sorts by bytes descending', () => {
    const result = computeInstallSizes([
      pkg({ name: 'a', version: '1.0.0', bytes: 100 }),
      pkg({ name: 'b', version: '1.0.0', bytes: 500 }),
      pkg({ name: 'c', version: '1.0.0', bytes: 200 }),
    ])
    expect(result.map(e => e.name)).toEqual(['b', 'c', 'a'])
  })

  it('excludes workspace packages by default', () => {
    const result = computeInstallSizes([
      pkg({ name: 'a', version: '1.0.0', bytes: 100 }),
      pkg({ name: 'ws', version: '1.0.0', bytes: 100, workspace: true }),
    ])
    expect(result.map(e => e.name)).toEqual(['a'])
  })

  it('includes workspace packages when includeWorkspace=true', () => {
    const result = computeInstallSizes([
      pkg({ name: 'a', version: '1.0.0', bytes: 100 }),
      pkg({ name: 'ws', version: '1.0.0', bytes: 100, workspace: true }),
    ], { includeWorkspace: true })
    expect(result.map(e => e.name).sort()).toEqual(['a', 'ws'])
  })

  it('respects limit', () => {
    const result = computeInstallSizes(
      [
        pkg({ name: 'a', version: '1.0.0', bytes: 100 }),
        pkg({ name: 'b', version: '1.0.0', bytes: 200 }),
        pkg({ name: 'c', version: '1.0.0', bytes: 300 }),
      ],
      { limit: 2 },
    )
    expect(result).toHaveLength(2)
  })
})

import type { PackageNode } from 'node-modules-tools'
import { describe, expect, it } from 'vitest'
import {
  computeMaintainerActions,
  groupMaintainerActions,
} from './maintainers'

interface PkgInput {
  name: string
  version: string
  depth?: number
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function pkg(input: PkgInput): PackageNode {
  return {
    name: input.name,
    version: input.version,
    spec: `${input.name}@${input.version}`,
    depth: input.depth ?? 1,
    resolved: {
      packageJson: {
        dependencies: input.dependencies,
        peerDependencies: input.peerDependencies,
      },
    },
  } as unknown as PackageNode
}

function buildVersions(packages: PackageNode[]): Map<string, PackageNode[]> {
  const map = new Map<string, PackageNode[]>()
  for (const p of packages) {
    let bucket = map.get(p.name)
    if (!bucket) {
      bucket = []
      map.set(p.name, bucket)
    }
    bucket.push(p)
  }
  return map
}

describe('computeMaintainerActions', () => {
  it('emits dep-upgrade when installed highest is gtr than declared range', () => {
    const dep1 = pkg({ name: 'dep', version: '1.0.0' })
    const dep2 = pkg({ name: 'dep', version: '2.0.0' })
    const consumer = pkg({
      name: 'consumer',
      version: '1.0.0',
      dependencies: { dep: '^1.0.0' },
    })
    const all = [consumer, dep1, dep2]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
    })
    const upgrades = items.filter(i => i.kind === 'dep-upgrade')
    expect(upgrades).toHaveLength(1)
    expect(upgrades[0]).toMatchObject({
      kind: 'dep-upgrade',
      depName: 'dep',
      depType: 'prod',
      declaredRange: '^1.0.0',
      installedHighestVersion: '2.0.0',
    })
  })

  it('does not emit when range is satisfied', () => {
    const dep = pkg({ name: 'dep', version: '1.5.0' })
    const consumer = pkg({
      name: 'consumer',
      version: '1.0.0',
      dependencies: { dep: '^1.0.0' },
    })
    const all = [consumer, dep]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
    })
    expect(items).toEqual([])
  })

  it('ignores prerelease versions when finding the highest installed version', () => {
    const stable = pkg({ name: 'dep', version: '1.5.0' })
    const prerelease = pkg({ name: 'dep', version: '2.0.0-beta.1' })
    const consumer = pkg({
      name: 'consumer',
      version: '1.0.0',
      dependencies: { dep: '^1.0.0' },
    })
    const all = [consumer, stable, prerelease]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
    })
    expect(items).toEqual([])
  })

  it('ignores invalid semver ranges', () => {
    const dep = pkg({ name: 'dep', version: '2.0.0' })
    const consumer = pkg({
      name: 'consumer',
      version: '1.0.0',
      dependencies: { dep: 'not a range' },
    })
    const all = [consumer, dep]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
    })
    expect(items).toEqual([])
  })

  it('resolves catalog: ranges', () => {
    const dep1 = pkg({ name: 'dep', version: '1.0.0' })
    const dep2 = pkg({ name: 'dep', version: '2.0.0' })
    const consumer = pkg({
      name: 'consumer',
      version: '1.0.0',
      dependencies: { dep: 'catalog:deps' },
    })
    const all = [consumer, dep1, dep2]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
      catalogs: { deps: { dep: '^1.0.0' } },
    })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      kind: 'dep-upgrade',
      declaredRange: '^1.0.0',
      rawRange: 'catalog:deps',
      catalogName: 'deps',
    })
  })

  it('emits publint action when publint messages are present', () => {
    const consumer = pkg({ name: 'consumer', version: '1.0.0' })
    ;(consumer as any).resolved.publint = [
      { type: 'error', code: 'X', message: 'm', args: {} },
      { type: 'warning', code: 'Y', message: 'm', args: {} },
    ]
    const items = computeMaintainerActions({
      packages: [consumer],
      versions: buildVersions([consumer]),
    })
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      kind: 'publint',
      counts: { error: 1, warning: 1, suggestion: 0 },
    })
  })
})

describe('groupMaintainerActions', () => {
  it('groups items by consumer and applies includePublint filter', () => {
    const dep2 = pkg({ name: 'dep', version: '2.0.0' })
    const consumer = pkg({
      name: 'consumer',
      version: '1.0.0',
      dependencies: { dep: '^1.0.0' },
    })
    ;(consumer as any).resolved.publint = [{ type: 'error', code: 'X', message: 'm', args: {} }]
    const all = [consumer, dep2]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
    })

    const withPublint = groupMaintainerActions(items, { includePublint: true })
    expect(withPublint).toHaveLength(1)
    expect(withPublint[0]!.items.map(i => i.kind).sort()).toEqual(['dep-upgrade', 'publint'])

    const withoutPublint = groupMaintainerActions(items, { includePublint: false })
    expect(withoutPublint).toHaveLength(1)
    expect(withoutPublint[0]!.items.map(i => i.kind)).toEqual(['dep-upgrade'])
  })

  it('deduplicates by name keeping highest version', () => {
    const dep2 = pkg({ name: 'dep', version: '2.0.0' })
    const consumerV1 = pkg({
      name: 'consumer',
      version: '1.0.0',
      dependencies: { dep: '^1.0.0' },
    })
    const consumerV2 = pkg({
      name: 'consumer',
      version: '2.0.0',
      dependencies: { dep: '^1.0.0' },
    })
    const all = [consumerV1, consumerV2, dep2]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
    })
    const groups = groupMaintainerActions(items)
    expect(groups).toHaveLength(1)
    expect(groups[0]!.consumer.version).toBe('2.0.0')
  })

  it('filters consumers to the latest major version', () => {
    const dep = pkg({ name: 'dep', version: '2.0.0' })
    const consumer = pkg({
      name: 'consumer',
      version: '2.1.0',
      dependencies: { dep: '^1.0.0' },
    })
    const all = [consumer, dep]
    const items = computeMaintainerActions({
      packages: all,
      versions: buildVersions(all),
    })

    expect(groupMaintainerActions(items, {
      latestOnly: true,
      latestVersionOf: () => '2.5.0',
    })).toHaveLength(1)
    expect(groupMaintainerActions(items, {
      latestOnly: true,
      latestVersionOf: () => '3.0.0',
    })).toEqual([])
  })
})

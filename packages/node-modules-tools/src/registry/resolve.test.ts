import type { PackageJson } from 'pkg-types'
import type { RegistryPackument } from './types'
import { describe, expect, it } from 'vitest'
import { resolveRegistryDependencies } from './resolve'

interface FixtureVersion {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
  optionalDependencies?: Record<string, string>
  unpackedSize?: number
  manifest?: Partial<PackageJson>
}

interface FixturePackage {
  distTags?: Record<string, string>
  versions: Record<string, FixtureVersion>
}

/**
 * Create a `fetch` implementation serving a mock registry from fixtures.
 */
function createMockRegistry(fixtures: Record<string, FixturePackage>) {
  const requests: string[] = []

  const fetch = (async (input: any) => {
    const url = new URL(String(input))
    requests.push(url.pathname)
    const segments = url.pathname.replace(/^\//, '').split('/').map(s => decodeURIComponent(s))

    // Scoped names occupy two path segments
    const name = segments[0]!.startsWith('@') && segments.length > 1
      ? `${segments[0]}/${segments[1]}`
      : segments[0]!
    const rest = segments.slice(name.includes('/') ? 2 : 1)

    const fixture = fixtures[name]
    if (!fixture)
      return new Response('not found', { status: 404, statusText: 'Not Found' })

    if (rest.length === 0) {
      // Abbreviated packument
      const versions = Object.fromEntries(Object.entries(fixture.versions).map(([version, v]) => [version, {
        name,
        version,
        dependencies: v.dependencies,
        peerDependencies: v.peerDependencies,
        peerDependenciesMeta: v.peerDependenciesMeta,
        optionalDependencies: v.optionalDependencies,
        dist: { unpackedSize: v.unpackedSize },
      }]))
      const latest = Object.keys(fixture.versions).at(-1)!
      const packument: RegistryPackument = {
        'name': name,
        'dist-tags': { latest, ...fixture.distTags },
        versions,
      }
      return Response.json(packument)
    }

    // Full version manifest
    const version = rest[0]!
    const v = fixture.versions[version]
    if (!v)
      return new Response('not found', { status: 404, statusText: 'Not Found' })
    return Response.json({
      name,
      version,
      dependencies: v.dependencies,
      peerDependencies: v.peerDependencies,
      optionalDependencies: v.optionalDependencies,
      ...v.manifest,
    })
  }) as typeof globalThis.fetch

  return { fetch, requests }
}

function specs(result: { packages: Map<string, any> }) {
  return [...result.packages.keys()].sort()
}

const ROOT_SPEC = 'registry-workspace@0.0.0'

describe('resolveRegistryDependencies', () => {
  it('resolves a simple dependency chain', async () => {
    const { fetch } = createMockRegistry({
      a: { versions: { '1.0.0': { dependencies: { b: '^1.0.0' } }, '1.2.0': { dependencies: { b: '^1.0.0' } } } },
      b: { versions: { '1.0.0': {}, '1.5.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { a: '^1.0.0' },
      fetch,
    })

    expect(specs(result)).toEqual(['a@1.2.0', 'b@1.5.0', ROOT_SPEC])
    expect(result.packageManager).toBe('npm-registry')
    expect(result.warnings).toEqual([])

    const root = result.packages.get(ROOT_SPEC)!
    expect(root.workspace).toBe(true)
    expect(root.depth).toBe(0)
    expect([...root.dependencies]).toEqual(['a@1.2.0'])

    const a = result.packages.get('a@1.2.0')!
    expect(a.depth).toBe(1)
    expect([...a.dependencies]).toEqual(['b@1.5.0'])
    expect([...a.clusters]).toEqual(['dep:prod'])

    const b = result.packages.get('b@1.5.0')!
    expect(b.depth).toBe(2)
    expect([...b.dependents]).toEqual(['a@1.2.0'])
    expect([...b.flatDependents].sort()).toEqual(['a@1.2.0', ROOT_SPEC])
    expect([...b.flatClusters]).toEqual(['dep:prod'])
  })

  it('dedupes packages resolved to the same exact version', async () => {
    const { fetch } = createMockRegistry({
      a: { versions: { '1.0.0': { dependencies: { c: '^1.0.0' } } } },
      b: { versions: { '1.0.0': { dependencies: { c: '~1.2.0' } } } },
      c: { versions: { '1.2.3': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { a: '*', b: '*' },
      fetch,
    })

    expect(specs(result)).toEqual(['a@1.0.0', 'b@1.0.0', 'c@1.2.3', ROOT_SPEC])
    expect([...result.packages.get('c@1.2.3')!.dependents].sort()).toEqual(['a@1.0.0', 'b@1.0.0'])
  })

  it('keeps duplicated versions when ranges do not overlap', async () => {
    const { fetch } = createMockRegistry({
      a: { versions: { '1.0.0': { dependencies: { d: '^2.0.0' } } } },
      d: { versions: { '1.0.0': {}, '2.4.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { a: '*', d: '1.0.0' },
      fetch,
    })

    expect(specs(result)).toEqual(['a@1.0.0', 'd@1.0.0', 'd@2.4.0', ROOT_SPEC])
  })

  it('reuses an already-resolved version to satisfy peers', async () => {
    const { fetch } = createMockRegistry({
      lib: { versions: { '1.0.0': { peerDependencies: { react: '>=16' } } } },
      react: { versions: { '18.2.0': {}, '19.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { lib: '*', react: '18.2.0' },
      fetch,
    })

    // react@19 exists and satisfies >=16, but 18.2.0 is already in the tree
    expect(specs(result)).toEqual(['lib@1.0.0', 'react@18.2.0', ROOT_SPEC])
    const lib = result.packages.get('lib@1.0.0')!
    expect([...lib.dependencies]).toEqual(['react@18.2.0'])
    // The edge is recorded as a peer relationship (subset of dependencies)
    expect([...lib.peerDependencies!]).toEqual(['react@18.2.0'])
  })

  it('auto-installs unsatisfied peers, including their dependencies', async () => {
    const { fetch } = createMockRegistry({
      lib: { versions: { '1.0.0': { peerDependencies: { peer: '^2.0.0' } } } },
      peer: { versions: { '2.1.0': { dependencies: { transitive: '*' } } } },
      transitive: { versions: { '1.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { lib: '*' },
      fetch,
    })

    expect(specs(result)).toEqual(['lib@1.0.0', 'peer@2.1.0', ROOT_SPEC, 'transitive@1.0.0'])
    const lib = result.packages.get('lib@1.0.0')!
    expect([...lib.dependencies]).toEqual(['peer@2.1.0'])
    expect([...lib.peerDependencies!]).toEqual(['peer@2.1.0'])
    // A regular (non-peer) dependency is NOT marked as a peer edge
    expect([...result.packages.get('peer@2.1.0')!.peerDependencies!]).toEqual([])
  })

  it('skips optional peers and optional dependencies', async () => {
    const { fetch } = createMockRegistry({
      lib: {
        versions: {
          '1.0.0': {
            dependencies: { fsevents: '^2.0.0' },
            optionalDependencies: { fsevents: '^2.0.0' },
            peerDependencies: { typescript: '*' },
            peerDependenciesMeta: { typescript: { optional: true } },
          },
        },
      },
      fsevents: { versions: { '2.3.0': {} } },
      typescript: { versions: { '5.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { lib: '*' },
      fetch,
    })

    expect(specs(result)).toEqual(['lib@1.0.0', ROOT_SPEC])
    expect(result.warnings).toEqual([])
  })

  it('resolves dist-tags and npm aliases', async () => {
    const { fetch } = createMockRegistry({
      pkg: { distTags: { beta: '2.0.0-beta.1' }, versions: { '1.0.0': {}, '2.0.0-beta.1': {} } },
      real: { versions: { '1.3.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { pkg: 'beta', aliased: 'npm:real@^1.0.0' },
      fetch,
    })

    expect(specs(result)).toEqual(['pkg@2.0.0-beta.1', 'real@1.3.0', ROOT_SPEC])
  })

  it('skips unsupported specs with a warning', async () => {
    const { fetch } = createMockRegistry({
      a: { versions: { '1.0.0': { dependencies: { linked: 'workspace:*' } } } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { a: '*', local: 'file:../local' },
      fetch,
    })

    expect(specs(result)).toEqual(['a@1.0.0', ROOT_SPEC])
    expect(result.warnings).toMatchObject([
      { type: 'unsupported-spec', name: 'local', spec: 'file:../local' },
      { type: 'unsupported-spec', name: 'linked', spec: 'workspace:*', dependent: 'a@1.0.0' },
    ])
  })

  it('warns on unresolvable versions and missing packages', async () => {
    const { fetch } = createMockRegistry({
      a: { versions: { '1.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { a: '^2.0.0', ghost: '*' },
      fetch,
    })

    expect(specs(result)).toEqual([ROOT_SPEC])
    expect(result.warnings.map(w => w.type).sort()).toEqual(['fetch-error', 'unresolved-version'])
  })

  it('resolves dependency cycles without deadlocking', async () => {
    // A cycle where the same `name@range` recurs on the back-edge used to
    // deadlock: a node's spec was only returned after its whole subtree
    // expanded, so a cyclic edge back to the in-flight node awaited itself.
    const { fetch } = createMockRegistry({
      a: { versions: { '1.0.0': { dependencies: { b: '^1.0.0' } } } },
      b: { versions: { '1.0.0': { dependencies: { c: '^1.0.0' } } } },
      c: { versions: { '1.0.0': { dependencies: { a: '^1.0.0' } } } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { a: '^1.0.0' },
      fetch,
    })

    expect(specs(result)).toEqual(['a@1.0.0', 'b@1.0.0', 'c@1.0.0', ROOT_SPEC])
    expect([...result.packages.get('a@1.0.0')!.dependencies]).toEqual(['b@1.0.0'])
    expect([...result.packages.get('b@1.0.0')!.dependencies]).toEqual(['c@1.0.0'])
    expect([...result.packages.get('c@1.0.0')!.dependencies]).toEqual(['a@1.0.0'])
    expect(result.warnings).toEqual([])
  })

  it('resolves a self-referential dependency without deadlocking', async () => {
    const { fetch } = createMockRegistry({
      a: { versions: { '1.0.0': { dependencies: { a: '^1.0.0', b: '^1.0.0' } } } },
      b: { versions: { '1.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { a: '^1.0.0' },
      fetch,
    })

    expect(specs(result)).toEqual(['a@1.0.0', 'b@1.0.0', ROOT_SPEC])
    expect([...result.packages.get('a@1.0.0')!.dependencies].sort()).toEqual(['a@1.0.0', 'b@1.0.0'])
  })

  it('respects the depth limit', async () => {
    const { fetch } = createMockRegistry({
      d1: { versions: { '1.0.0': { dependencies: { d2: '*' } } } },
      d2: { versions: { '1.0.0': { dependencies: { d3: '*' } } } },
      d3: { versions: { '1.0.0': { dependencies: { d4: '*' } } } },
      d4: { versions: { '1.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { d1: '*' },
      depth: 2,
      fetch,
    })

    expect(specs(result)).toEqual(['d1@1.0.0', 'd2@1.0.0', ROOT_SPEC])
  })

  it('populates resolved fields from manifests and sizes from packuments', async () => {
    const { fetch } = createMockRegistry({
      esm: {
        versions: {
          '1.0.0': {
            unpackedSize: 12345,
            manifest: {
              type: 'module',
              exports: { '.': './index.js' },
              license: 'MIT',
              repository: { type: 'git', url: 'git+https://github.com/user/esm.git' },
            },
          },
        },
      },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { esm: '*' },
      fetch,
    })

    const pkg = result.packages.get('esm@1.0.0')!
    expect(pkg.resolved.module).toBe('esm')
    expect(pkg.resolved.installSize).toEqual({ bytes: 12345, categories: {} })
    expect(pkg.resolved.license).toBe('MIT')
    expect(pkg.resolved.repository).toMatchObject({ repo: 'user/esm', url: 'https://github.com/user/esm' })

    const root = result.packages.get(ROOT_SPEC)!
    expect(root.resolved.packageJson.private).toBe(true)
  })

  it('handles scoped packages', async () => {
    const { fetch, requests } = createMockRegistry({
      '@scope/pkg': { versions: { '1.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { '@scope/pkg': '^1.0.0' },
      fetch,
    })

    expect(specs(result)).toEqual(['@scope/pkg@1.0.0', ROOT_SPEC])
    expect(requests).toContain('/@scope%2Fpkg')
  })

  it('excludes a package and its exclusively-reachable dependencies', async () => {
    const { fetch, requests } = createMockRegistry({
      'nuxt': { versions: { '3.0.0': { dependencies: { '@nuxt/kit': '^3.0.0', 'h3': '^1.0.0' } } } },
      '@nuxt/kit': { versions: { '3.0.0': { dependencies: { unctx: '^2.0.0' } } } },
      'unctx': { versions: { '2.0.0': {} } },
      'h3': { versions: { '1.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { nuxt: '*' },
      excludes: [{ name: '@nuxt/kit', range: '*' }],
      fetch,
    })

    // @nuxt/kit and its only-reachable dep unctx are gone; h3 stays
    expect(specs(result)).toEqual(['h3@1.0.0', 'nuxt@3.0.0', ROOT_SPEC])
    expect([...result.packages.get('nuxt@3.0.0')!.dependencies]).toEqual(['h3@1.0.0'])
    // Metadata for the excluded subtree is never fetched
    expect(requests.some(p => p.includes('@nuxt%2Fkit'))).toBe(false)
    expect(requests.some(p => p.startsWith('/unctx'))).toBe(false)
  })

  it('keeps a shared dep still reachable from a non-excluded path', async () => {
    const { fetch } = createMockRegistry({
      'nuxt': { versions: { '3.0.0': { dependencies: { '@nuxt/kit': '^3.0.0', 'vite': '^5.0.0' } } } },
      '@nuxt/kit': { versions: { '3.0.0': { dependencies: { vite: '^5.0.0' } } } },
      'vite': { versions: { '5.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { nuxt: '*' },
      excludes: [{ name: '@nuxt/kit', range: '*' }],
      fetch,
    })

    // vite is still a direct dep of nuxt, so it stays
    expect(specs(result)).toEqual(['nuxt@3.0.0', ROOT_SPEC, 'vite@5.0.0'])
  })

  it('excludes an explicit root (exclude wins)', async () => {
    const { fetch } = createMockRegistry({
      nuxt: { versions: { '3.0.0': {} } },
      vite: { versions: { '5.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { nuxt: '*', vite: '*' },
      excludes: [{ name: 'vite', range: '*' }],
      fetch,
    })

    expect(specs(result)).toEqual(['nuxt@3.0.0', ROOT_SPEC])
  })

  it('matches ranged excludes against the requested range', async () => {
    const { fetch } = createMockRegistry({
      app: { versions: { '1.0.0': { dependencies: { vite: '^5.0.0' } } } },
      vite: { versions: { '5.0.0': {} } },
    })

    // exclude vite@4 should NOT match a request for ^5
    const kept = await resolveRegistryDependencies({
      dependencies: { app: '*' },
      excludes: [{ name: 'vite', range: '4' }],
      fetch,
    })
    expect(specs(kept)).toEqual(['app@1.0.0', ROOT_SPEC, 'vite@5.0.0'])

    // exclude vite@5 should match a request for ^5
    const dropped = await resolveRegistryDependencies({
      dependencies: { app: '*' },
      excludes: [{ name: 'vite', range: '5' }],
      fetch,
    })
    expect(specs(dropped)).toEqual(['app@1.0.0', ROOT_SPEC])
  })

  it('excludes peer dependencies too', async () => {
    const { fetch } = createMockRegistry({
      lib: { versions: { '1.0.0': { peerDependencies: { react: '>=16' } } } },
      react: { versions: { '18.0.0': {} } },
    })

    const result = await resolveRegistryDependencies({
      dependencies: { lib: '*' },
      excludes: [{ name: 'react', range: '*' }],
      fetch,
    })

    expect(specs(result)).toEqual(['lib@1.0.0', ROOT_SPEC])
    expect([...result.packages.get('lib@1.0.0')!.dependencies]).toEqual([])
  })

  it('reports progress and uses caches', async () => {
    const { fetch, requests } = createMockRegistry({
      a: { versions: { '1.0.0': { dependencies: { b: '*' } } } },
      b: { versions: { '1.0.0': {} } },
    })

    const store = new Map<string, any>()
    const cache = {
      getItem: async (key: string) => store.get(key),
      setItem: async (key: string, value: any) => void store.set(key, value),
    }

    const phases: string[] = []
    const result = await resolveRegistryDependencies({
      dependencies: { a: '*' },
      fetch,
      cachePackument: cache,
      cacheManifest: cache,
      onProgress: p => phases.push(`${p.phase}:${p.count}`),
    })
    expect(result.packages.size).toBe(3)
    expect(phases).toContain('resolving:1')
    expect(phases).toContain('manifests:3')

    // Second run should be served from the caches entirely
    const before = requests.length
    const again = await resolveRegistryDependencies({
      dependencies: { a: '*' },
      fetch,
      cachePackument: cache,
      cacheManifest: cache,
    })
    expect(again.packages.size).toBe(3)
    expect(requests.length).toBe(before)
  })
})

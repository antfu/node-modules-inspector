import type { PackageJson } from 'pkg-types'
import type { PackageNode, PackageNodeRaw } from '../types'
import type {
  RegistryAbbreviatedVersion,
  RegistryResolveWarning,
  ResolveRegistryDependenciesOptions,
  ResolveRegistryDependenciesResult,
} from './types'
import pLimit from 'p-limit'
import { compare, findMaxSatisfying, satisfies } from 'verkit'
import { populateRawResult } from '../graph'
import { resolvePackageJsonFields } from '../resolve-json'
import { createRegistryFetcher } from './fetch'
import { constructExcludeMatcher, isRegistryResolvableSpec, parseNpmAlias } from './spec'

export const REGISTRY_PACKAGE_MANAGER = 'npm-registry'

const DEFAULT_ROOT_NAME = 'registry-workspace'

interface PeerTask {
  dependentNode: PackageNodeRaw
  name: string
  range: string
  depth: number
}

interface ExpandTask {
  node: PackageNodeRaw
  meta: RegistryAbbreviatedVersion
  depth: number
}

/**
 * Resolve a dependency graph purely from npm-registry metadata — no package
 * manager, no filesystem. Produces the same result shape as
 * `listPackageDependencies`, with an extra `warnings` list.
 *
 * The resolution is an idealized approximation of a fresh install:
 * - each range resolves to the max-satisfying published version
 * - packages are deduped by exact `name@version`
 * - non-optional `peerDependencies` are satisfied by an already-resolved
 *   version when possible, otherwise auto-installed (npm 7+ behavior)
 * - `optionalDependencies` and optional peers are skipped
 * - specs not resolvable from the registry (workspace:, file:, git, etc.)
 *   are skipped and reported as warnings
 */
export async function resolveRegistryDependencies(
  options: ResolveRegistryDependenciesOptions,
): Promise<ResolveRegistryDependenciesResult> {
  const {
    depth: maxDepth = 8,
    concurrency = 16,
    rootName = DEFAULT_ROOT_NAME,
    onProgress,
  } = options

  const fetcher = createRegistryFetcher(options)
  const limit = pLimit(concurrency)

  // An excluded edge is pruned before its version is resolved, so the
  // excluded package's metadata is never fetched.
  const isExcluded = constructExcludeMatcher(options.excludes || [])

  const packages = new Map<string, PackageNodeRaw>()
  const versionMeta = new Map<string, RegistryAbbreviatedVersion>()
  const versionsByName = new Map<string, Set<string>>()
  const warnings: RegistryResolveWarning[] = []
  const resolutions = new Map<string, Promise<string | null>>()
  const peerTasks: PeerTask[] = []
  // Expansion of a node's subtree is deferred and drained to a fixpoint by the
  // driver below, rather than awaited inline while resolving the node. This is
  // what keeps dependency cycles from deadlocking: a node's spec is returned as
  // soon as its version is picked, so a cyclic edge back to an in-flight
  // `name@range` resolves immediately instead of awaiting its own subtree.
  const expandQueue: ExpandTask[] = []

  function warn(warning: RegistryResolveWarning) {
    warnings.push(warning)
  }

  function reportResolving() {
    onProgress?.({ phase: 'resolving', count: packages.size })
  }

  /**
   * Resolve `name@range` to an exact published version using the packument.
   */
  async function pickVersion(name: string, range: string, dependent?: string): Promise<string | null> {
    let packument
    try {
      packument = await limit(() => fetcher.getPackument(name))
    }
    catch (err) {
      warn({
        type: 'fetch-error',
        name,
        spec: range,
        dependent,
        message: `Failed to fetch metadata for "${name}": ${err instanceof Error ? err.message : String(err)}`,
      })
      return null
    }

    const distTags = packument['dist-tags'] || {}
    const versions = Object.keys(packument.versions || {})

    let version: string | null | undefined
    if (!range || range === '*' || range === 'x') {
      version = distTags.latest || findMaxSatisfying(versions, '*')
    }
    else if (distTags[range]) {
      version = distTags[range]
    }
    else {
      try {
        version = findMaxSatisfying(versions, range)
      }
      catch {
        version = null
      }
      version ??= packument.versions[range] ? range : null
    }

    if (!version || !packument.versions[version]) {
      warn({
        type: 'unresolved-version',
        name,
        spec: range,
        dependent,
        message: `No published version of "${name}" satisfies "${range}"`,
      })
      return null
    }
    return version
  }

  /**
   * Ensure `name@range` is resolved into the graph, returns the exact spec.
   * Deduped per `name@range`; the node itself is deduped per `name@version`.
   */
  function addPackage(name: string, range: string, depth: number, dependent?: string): Promise<string | null> {
    if (!isRegistryResolvableSpec(range)) {
      warn({
        type: 'unsupported-spec',
        name,
        spec: range,
        dependent,
        message: `"${name}@${range}" cannot be resolved from the npm registry`,
      })
      return Promise.resolve(null)
    }

    const alias = parseNpmAlias(range)
    if (alias) {
      name = alias.name
      range = alias.range
    }

    // Excluded: never add the node nor expand its edges (skip metadata fetch)
    if (isExcluded(name, range))
      return Promise.resolve(null)

    const key = `${name}@${range}`
    if (!resolutions.has(key)) {
      resolutions.set(key, (async () => {
        const version = await pickVersion(name, range, dependent)
        if (!version)
          return null

        const spec = `${name}@${version}`
        if (!packages.has(spec)) {
          const meta = (await fetcher.getPackument(name)).versions[version]!
          const node: PackageNodeRaw = {
            name,
            version,
            spec,
            // A virtual pnpm-style path: nothing exists on disk, but an
            // empty filepath means "not installed" downstream (e.g. the
            // optional-dependencies filter), and these nodes are all
            // installed in the idealized tree.
            filepath: `node_modules/.pnpm/${name.replace('/', '+')}@${version}/node_modules/${name}`,
            dependencies: new Set(),
            peerDependencies: new Set(),
            clusters: new Set(),
          }
          packages.set(spec, node)
          versionMeta.set(spec, meta)
          if (!versionsByName.has(name))
            versionsByName.set(name, new Set())
          versionsByName.get(name)!.add(version)
          reportResolving()

          // Defer expansion so this promise resolves to `spec` right away —
          // see `expandQueue` above for why this avoids cycle deadlocks.
          if (depth < maxDepth)
            expandQueue.push({ node, meta, depth })
        }
        return spec
      })())
    }
    return resolutions.get(key)!
  }

  /**
   * Schedule resolution of a node's dependencies (and queue its peers).
   */
  async function expandNode(node: PackageNodeRaw, meta: RegistryAbbreviatedVersion, depth: number): Promise<void> {
    const tasks: Promise<void>[] = []

    for (const [depName, depRange] of Object.entries(meta.dependencies || {})) {
      // optionalDependencies are also listed in dependencies — skip them
      if (meta.optionalDependencies && depName in meta.optionalDependencies)
        continue
      tasks.push(addPackage(depName, depRange, depth + 1, node.spec).then((spec) => {
        if (spec)
          node.dependencies.add(spec)
      }))
    }

    for (const [peerName, peerRange] of Object.entries(meta.peerDependencies || {})) {
      if (meta.peerDependenciesMeta?.[peerName]?.optional)
        continue
      if (isExcluded(peerName, peerRange))
        continue
      peerTasks.push({ dependentNode: node, name: peerName, range: peerRange, depth })
    }

    await Promise.all(tasks)
  }

  /**
   * Satisfy a peer with an already-resolved version when possible,
   * otherwise auto-install it (npm 7+ behavior).
   */
  async function resolvePeer(task: PeerTask): Promise<void> {
    const { dependentNode, name, range, depth } = task
    const existing = [...versionsByName.get(name) || []]
      .filter(v => satisfies(v, range))
      .sort(compare)

    if (existing.length) {
      const spec = `${name}@${existing[existing.length - 1]}`
      dependentNode.dependencies.add(spec)
      dependentNode.peerDependencies!.add(spec)
      return
    }

    const spec = await addPackage(name, range, depth + 1, dependentNode.spec)
    if (spec) {
      dependentNode.dependencies.add(spec)
      dependentNode.peerDependencies!.add(spec)
    }
  }

  // ---- Phase 1: resolve the graph ----

  const rootDependencies = new Set<string>()
  await Promise.all(Object.entries(options.dependencies).map(async ([name, range]) => {
    const spec = await addPackage(name, range, 1)
    if (spec) {
      rootDependencies.add(spec)
      packages.get(spec)?.clusters.add('dep:prod')
    }
  }))

  // Drain the deferred subtree expansions, then any auto-installed peers.
  // Both may enqueue further work (expansions bring more deps and peers; peers
  // may auto-install packages with their own subtrees), so iterate to a
  // fixpoint. Expansions are fully drained before peers so a peer is matched
  // against the complete non-peer graph (npm 7+ behavior).
  while (expandQueue.length || peerTasks.length) {
    if (expandQueue.length) {
      const batch = expandQueue.splice(0)
      await Promise.all(batch.map(task => expandNode(task.node, task.meta, task.depth)))
    }
    else {
      const batch = peerTasks.splice(0)
      await Promise.all(batch.map(task => resolvePeer(task)))
    }
  }

  // Synthetic workspace root holding the inputs (hidden by the default workspace filter)
  const rootSpec = `${rootName}@0.0.0`
  const rootNode: PackageNodeRaw = {
    name: rootName,
    version: '0.0.0',
    spec: rootSpec,
    filepath: '.',
    dependencies: rootDependencies,
    peerDependencies: new Set(),
    workspace: true,
    private: true,
    clusters: new Set(),
  }
  packages.set(rootSpec, rootNode)

  const base = populateRawResult({
    root: '',
    packageManager: REGISTRY_PACKAGE_MANAGER,
    packages,
  })

  // ---- Phase 2: fetch full manifests for display metadata ----

  const nodes = [...base.packages.values()] as PackageNode[]
  let manifestCount = 0
  const manifestTotal = nodes.length

  await Promise.all(nodes.map(node => limit(async () => {
    const meta = versionMeta.get(node.spec)

    if (node.workspace) {
      node.resolved = {
        module: 'unknown',
        packageJson: {
          name: node.name,
          version: node.version,
          private: true,
          dependencies: options.dependencies,
        },
      }
    }
    else {
      let manifest: PackageJson | undefined
      try {
        manifest = await fetcher.getManifest(node.name, node.version)
      }
      catch (err) {
        warn({
          type: 'fetch-error',
          name: node.name,
          spec: node.spec,
          message: `Failed to fetch manifest for "${node.spec}": ${err instanceof Error ? err.message : String(err)}`,
        })
      }
      node.resolved = {
        ...resolvePackageJsonFields(manifest || (meta as PackageJson) || { name: node.name, version: node.version }),
        installSize: meta?.dist?.unpackedSize
          ? { bytes: meta.dist.unpackedSize, categories: {} }
          : undefined,
      }
    }

    manifestCount += 1
    onProgress?.({ phase: 'manifests', count: manifestCount, total: manifestTotal })
  })))

  return {
    ...base,
    packages: base.packages as ResolveRegistryDependenciesResult['packages'],
    warnings,
  }
}

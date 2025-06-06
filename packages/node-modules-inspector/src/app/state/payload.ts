import type { NpmMeta, NpmMetaLatest, PackageNode } from 'node-modules-tools'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_OPTIONAL, CLUSTER_DEP_PROD } from 'node-modules-tools/constants'
import { computed, reactive, watch } from 'vue'
import { buildVersionToPackagesMap } from '../utils/maps'
import { rawNpmMeta, rawNpmMetaLatest, rawPayload, rawReferencePayload } from './data'
import { filters, filterSelectPredicate, filtersExcludePredicate } from './filters'

export type ComputedPayload = ReturnType<typeof createComputedPayload>

function createComputedPayload(getter: () => PackageNode[]) {
  const packages = computed(getter)
  const map = computed(() => new Map(packages.value.map(i => [i.spec, i])))
  const versions = computed(() => buildVersionToPackagesMap(packages.value))
  const clusters = computed(() => {
    const clusters = new Set<string>()
    for (const pkg of packages.value) {
      for (const cluster of pkg.clusters) {
        clusters.add(cluster)
      }
    }
    return clusters
  })

  const get = (spec: string | PackageNode): PackageNode | undefined => {
    if (typeof spec === 'string')
      return map.value.get(spec)
    return map.value.has(spec.spec)
      ? spec
      : undefined
  }

  const has = (spec: string | PackageNode): boolean => {
    return map.value.has(typeof spec === 'string' ? spec : spec.spec)
  }

  const getList = (specs: Iterable<string>): PackageNode[] => {
    return Array.from(function* () {
      for (const spec of specs) {
        const pkg = get(spec)
        if (pkg)
          yield pkg
      }
    }())
  }

  const _cacheList = {
    dependencies: new Map<string, PackageNode[]>(),
    dependents: new Map<string, PackageNode[]>(),
    flatDependencies: new Map<string, PackageNode[]>(),
    flatDependents: new Map<string, PackageNode[]>(),
  }

  const _cacheFlatClusters = new Map<string, Set<string>>()

  watch(packages, () => {
    _cacheList.dependencies.clear()
    _cacheList.dependents.clear()
    _cacheList.flatDependencies.clear()
    _cacheList.flatDependents.clear()
    _cacheFlatClusters.clear()
  })

  function cachedGetList(key: keyof typeof _cacheList): (pkg: PackageNode) => PackageNode[] {
    return (pkg) => {
      const cached = _cacheList[key].get(pkg.spec)
      if (cached)
        return cached
      const result = getList(pkg[key])
      _cacheList[key].set(pkg.spec, result)
      return result
    }
  }

  const flatDependents = cachedGetList('flatDependents')
  const flatDependencies = cachedGetList('flatDependencies')
  const dependencies = cachedGetList('dependencies')
  const dependents = cachedGetList('dependents')

  function flatClusters(pkg: PackageNode) {
    const cached = _cacheFlatClusters.get(pkg.spec)
    if (cached)
      return cached
    const result = new Set(pkg.clusters)
    for (const dep of flatDependents(pkg)) {
      for (const cluster of dep.clusters) {
        result.add(cluster)
      }
    }
    _cacheFlatClusters.set(pkg.spec, result)
    return result
  }

  function isInDepCluster(pkg: PackageNode, type: 'dev' | 'prod' | 'optional') {
    return flatClusters(pkg).has(
      type === 'dev'
        ? CLUSTER_DEP_DEV
        : type === 'prod'
          ? CLUSTER_DEP_PROD
          : CLUSTER_DEP_OPTIONAL,
    )
  }

  return reactive({
    packages,
    map,
    versions,
    clusters,

    has,
    get,
    getList,

    dependencies,
    dependents,
    flatDependents,
    flatDependencies,
    flatClusters,
    isInDepCluster,
  })
}

const _main = createComputedPayload(() => Array.from(rawPayload.value?.packages.values() || []))
const _reference = createComputedPayload(() => Array.from(rawReferencePayload.value?.packages.values() || []))

const _excluded = createComputedPayload(() => {
  const excluded = new Set(_main.packages.filter(filtersExcludePredicate))

  let changed = true
  while (changed) {
    changed = false
    for (const pkg of _main.packages) {
      if (excluded.has(pkg) || !pkg.dependents.size)
        continue
      let shouldExclude = true
      for (const parentSpec of pkg.dependents) {
        const parent = _main.map.get(parentSpec)
        if (!parent || !excluded.has(parent)) {
          shouldExclude = false
          break
        }
      }
      if (!shouldExclude)
        continue
      excluded.add(pkg)
      changed = true
    }
  }

  if (filters.state.excludeWorkspace) {
    for (const pkg of _main.packages) {
      if (pkg.workspace)
        excluded.add(pkg)
    }
  }

  return Array.from(excluded)
})

const _workspace = createComputedPayload(() =>
  _main.packages
    .filter(pkg => pkg.workspace),
)

const _avaliable = createComputedPayload(() =>
  _main.packages
    .filter(pkg => !_excluded.map.has(pkg.spec)),
)

const _filtered = createComputedPayload(() =>
  _avaliable.packages
    .filter(filterSelectPredicate.value),
)

const _compareA = createComputedPayload(() => {
  if (!filters.state.compareA?.length)
    return []
  const packages = new Set(
    _avaliable.getList(filters.state.compareA)
      .flatMap(pkg => [pkg, ..._avaliable.flatDependencies(pkg)]),
  )
  return Array.from(packages)
})

const _compareB = createComputedPayload(() => {
  if (!filters.state.compareB?.length)
    return []
  const packages = new Set(
    _avaliable.getList(filters.state.compareB)
      .flatMap(pkg => [pkg, ..._avaliable.flatDependencies(pkg)]),
  )
  return Array.from(packages)
})

export const payloads = {
  main: _main,
  excluded: _excluded,
  workspace: _workspace,
  avaliable: _avaliable,
  filtered: _filtered,

  compareA: _compareA,
  compareB: _compareB,

  reference: _reference,
}

export function getNpmMeta(input: PackageNode | string): NpmMeta | null {
  const pkg = payloads.main.get(input)
  if (!pkg)
    return null
  return pkg.resolved.npmMeta || rawNpmMeta.value.get(pkg.spec) || null
}

export function getNpmMetaLatest(input: PackageNode | string): NpmMetaLatest | null {
  const pkg = payloads.main.get(input)
  if (!pkg)
    return null
  return [pkg.resolved.npmMetaLatest, rawNpmMetaLatest.value.get(pkg.name)]
    .filter(x => !!x)
    .sort((a, b) => b.fetechedAt - a.fetechedAt)[0] || null
}

export function getPublishTime(input: PackageNode | string) {
  const time = getNpmMeta(input)?.publishedAt
  return time ? new Date(time) : null
}

export type DeprecationType = 'package' | 'current' | 'future'

export function getDeprecatedInfo(input: PackageNode | string) {
  const meta = getNpmMeta(input)
  const metaLatest = getNpmMetaLatest(input)
  if (!meta?.deprecated && !metaLatest?.deprecated)
    return null
  const type: DeprecationType = (meta?.deprecated && metaLatest?.deprecated)
    ? 'package'
    : (meta?.deprecated && !metaLatest?.deprecated)
        ? 'current'
        : 'future'
  return {
    type,
    current: meta?.deprecated,
    latest: metaLatest?.deprecated,
    latestVersion: metaLatest?.version,
  }
}

export function getVulnerability(input: PackageNode | string) {
  const meta = getNpmMeta(input)
  return meta?.vulnerability || null
}

export const totalWorkspaceSize = computed(() => {
  return Array.from(payloads.avaliable.packages).reduce((acc, pkg) => acc + (pkg.resolved.installSize?.bytes || 0), 0)
})

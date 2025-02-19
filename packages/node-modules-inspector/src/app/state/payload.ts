import type { PackageNode } from 'node-modules-tools'
import { computed, reactive, watch } from 'vue'
import { buildVersionToPackagesMap } from '../utils/maps'
import { rawData, rawPublishDates } from './data'
import { filters, filterSelectPredicate, filtersExcludePredicate } from './filters'

export type ComputedPayload = ReturnType<typeof createComputedPayload>

function createComputedPayload(getter: () => PackageNode[]) {
  const packages = computed(getter)
  const map = computed(() => new Map(packages.value.map(i => [i.spec, i])))
  const versions = computed(() => buildVersionToPackagesMap(packages.value))

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
    return Array.from(function *() {
      for (const spec of specs) {
        const pkg = get(spec)
        if (pkg)
          yield pkg
      }
    }())
  }

  const _cache = {
    dependencies: new Map<string, PackageNode[]>(),
    dependents: new Map<string, PackageNode[]>(),
    flatDependencies: new Map<string, PackageNode[]>(),
    flatDependents: new Map<string, PackageNode[]>(),
  }

  watch(packages, () => {
    _cache.dependencies.clear()
    _cache.dependents.clear()
    _cache.flatDependencies.clear()
    _cache.flatDependents.clear()
  })

  function cached(key: keyof typeof _cache): (pkg: PackageNode) => PackageNode[] {
    return (pkg) => {
      const cached = _cache[key].get(pkg.spec)
      if (cached)
        return cached
      const result = getList(pkg[key])
      _cache[key].set(pkg.spec, result)
      return result
    }
  }

  const flatDependents = cached('flatDependents')
  const flatDependencies = cached('flatDependencies')
  const dependencies = cached('dependencies')
  const dependents = cached('dependents')

  return reactive({
    packages,
    map,
    versions,
    has,
    get,
    getList,

    dependencies,
    dependents,
    flatDependents,
    flatDependencies,
  })
}

const _all = createComputedPayload(() => Array.from(rawData.value?.packages.values() || []))

const _excluded = createComputedPayload(() => {
  const excluded = new Set(_all.packages.filter(filtersExcludePredicate))

  let changed = true
  while (changed) {
    changed = false
    for (const pkg of _all.packages) {
      if (excluded.has(pkg) || !pkg.dependents.size)
        continue
      let shouldExclude = true
      for (const parentSpec of pkg.dependents) {
        const parent = _all.map.get(parentSpec)
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

  if (filters.state['exclude-workspace']) {
    for (const pkg of _all.packages) {
      if (pkg.workspace)
        excluded.add(pkg)
    }
  }

  return Array.from(excluded)
})

const _workspace = createComputedPayload(() =>
  _all.packages
    .filter(pkg => pkg.workspace),
)

const _avaliable = createComputedPayload(() =>
  _all.packages
    .filter(pkg => !_excluded.map.has(pkg.spec)),
)

const _filtered = createComputedPayload(() =>
  _avaliable.packages
    .filter(filterSelectPredicate.value),
)

const _compareA = createComputedPayload(() => {
  if (!filters.state['compare-a']?.length)
    return []
  const packages = new Set(
    _avaliable.getList(filters.state['compare-a'])
      .flatMap(pkg => [pkg, ..._avaliable.flatDependencies(pkg)]),
  )
  return Array.from(packages)
})

const _compareB = createComputedPayload(() => {
  if (!filters.state['compare-b']?.length)
    return []
  const packages = new Set(
    _avaliable.getList(filters.state['compare-b'])
      .flatMap(pkg => [pkg, ..._avaliable.flatDependencies(pkg)]),
  )
  return Array.from(packages)
})

export const payloads = {
  all: _all,
  excluded: _excluded,
  workspace: _workspace,
  avaliable: _avaliable,
  filtered: _filtered,

  compareA: _compareA,
  compareB: _compareB,
}

export function getPublishTime(input: PackageNode | string) {
  const pkg = payloads.all.get(input)
  if (!pkg)
    return null
  if (pkg.resolved.publishTime)
    return new Date(pkg.resolved.publishTime)
  const date = rawPublishDates.value?.get(pkg.spec)
  if (date)
    return new Date(date)
  return null
}

export const totalWorkspaceSize = computed(() => {
  return Array.from(payloads.avaliable.packages).reduce((acc, pkg) => acc + (pkg.resolved.installSize?.bytes || 0), 0)
})

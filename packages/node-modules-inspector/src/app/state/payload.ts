import type { PackageNode } from 'node-modules-tools'
import pm from 'picomatch'
import { computed, reactive, watch } from 'vue'
import { buildVersionToPackagesMap } from '../utils/maps'
import { getModuleType } from '../utils/module-type'
import { rawData } from './data'
import { filters, filterSearchDebounced } from './filters'

export type ComputedPayload = ReturnType<typeof createComputedPayload>

function createComputedPayload(getter: () => PackageNode[]) {
  const packages = computed(getter)
  const map = computed(() => new Map(packages.value.map(i => [i.spec, i])))
  const versions = computed(() => buildVersionToPackagesMap(packages.value))

  const get = (spec: string): PackageNode | undefined => {
    return map.value.get(spec)
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
  const excluded = new Set(_all.packages
    .filter((pkg) => {
      if (filters['exclude-dts'] && pkg.resolved.module === 'dts')
        return true
      if (filters['exclude-private'] && pkg.private)
        return true
      if (filters.excludes && filters.excludes.includes(pkg.spec))
        return true
      return false
    }))

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

  return Array.from(excluded)
})

const _workspace = createComputedPayload(() => _all.packages.filter(pkg => pkg.workspace))

const _avaliable = createComputedPayload(() => {
  return _all.packages
    .filter(pkg => !_excluded.map.has(pkg.spec))
})

const _filtered = createComputedPayload(() => Array.from((function *() {
  for (const pkg of _avaliable.packages) {
    if (filters.focus) {
      const shouldTake = filters.focus.includes(pkg.spec) || filters.focus.some(f => pkg.flatDependents.has(f))
      if (!shouldTake)
        continue
    }

    if (filters.why) {
      const shouldTake = filters.why.includes(pkg.spec) || filters.why.some(f => pkg.flatDependencies.has(f))
      if (!shouldTake)
        continue
    }

    if (filters.modules) {
      const type = getModuleType(pkg)
      // dts is always included here, as it's controlled by the exclude-dts option
      if (!filters.modules.includes(type) && type !== 'dts')
        continue
    }

    if (filterSearchDebounced.value) {
      if (filterSearchDebounced.value.match(/[*[\]]/)) {
        if (!pm.isMatch(pkg.name, filterSearchDebounced.value))
          continue
      }
      else {
        if (!pkg.name.includes(filterSearchDebounced.value))
          continue
      }
    }

    if (filters['source-type']) {
      if (filters['source-type'] === 'prod' && !pkg.prod && !pkg.workspace)
        continue
      if (filters['source-type'] === 'dev' && !pkg.dev && !pkg.workspace)
        continue
    }

    yield pkg
  }
})()))

export const payloads = {
  all: _all,
  excluded: _excluded,
  workspace: _workspace,
  avaliable: _avaliable,
  filtered: _filtered,
}

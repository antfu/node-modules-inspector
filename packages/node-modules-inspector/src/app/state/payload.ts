import type { PackageNode } from 'node-modules-tools'
import { computed, reactive, watch } from 'vue'
import { buildVersionToPackagesMap } from '../utils/maps'
import { getModuleType } from '../utils/module-type'
import { parseSearch } from '../utils/search-parser'
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

const _filtered = createComputedPayload(() => {
  const predicates: ((pkg: PackageNode) => boolean | undefined)[] = []

  if (filters.focus) {
    predicates.push(pkg => filters.focus!.includes(pkg.spec) || filters.focus!.some(f => pkg.flatDependents.has(f)))
  }

  if (filters.why) {
    predicates.push(pkg => filters.why!.includes(pkg.spec) || filters.why!.some(f => pkg.flatDependencies.has(f)))
  }

  predicates.push((pkg) => {
    const type = getModuleType(pkg)
    // dts is always included here, as it's controlled by the exclude-dts option
    if (type === 'dts')
      return false
    if (filters.modules)
      return filters.modules.includes(type)
    return true
  })

  if (filters['source-type']) {
    predicates.push((pkg) => {
      if (filters['source-type'] === 'prod')
        return pkg.prod || pkg.workspace
      if (filters['source-type'] === 'dev')
        return pkg.dev || pkg.workspace
      return true
    })
  }

  if (filterSearchDebounced.value.trim()) {
    const parsed = parseSearch(filterSearchDebounced.value)
    const predicate = (pkg: PackageNode) => {
      if (parsed.not?.length) {
        for (const re of parsed.not) {
          if (re.test(pkg.spec))
            return false
        }
      }
      if (parsed.license?.length) {
        if (!pkg.resolved.license)
          return false
        for (const re of parsed.license) {
          if (!re.test(pkg.resolved.license))
            return false
        }
      }
      if (parsed.author?.length) {
        if (!pkg.resolved.author)
          return false
        for (const re of parsed.author) {
          if (!re.test(pkg.resolved.author))
            return false
        }
      }
      if (parsed.text) {
        // TODO: fuzzy search
        if (!pkg.spec.includes(parsed.text))
          return false
      }

      return true
    }

    if (parsed.invert)
      predicates.push(pkg => !predicate(pkg))
    else
      predicates.push(predicate)
  }

  if (!predicates.length)
    return _avaliable.packages
  return _avaliable.packages.filter(pkg => predicates.every(p => p(pkg)))
})

export const payloads = {
  all: _all,
  excluded: _excluded,
  workspace: _workspace,
  avaliable: _avaliable,
  filtered: _filtered,
}

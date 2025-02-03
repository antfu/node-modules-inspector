import pm from 'picomatch'
import { computed, reactive } from 'vue'
import { buildVersionToPackagesMap } from '../utils/maps'
import { getModuleType } from '../utils/module-type'
import { rawData } from './data'
import { filters, filterSearchDebounced } from './filters'

const _all_packages = computed(() => Array.from(rawData.value?.packages.values() || []))
const _all_packages_map = computed(() => new Map(_all_packages.value.map(i => [i.spec, i])))

const _excluded_packages = computed(() => {
  const excluded = new Set(_all_packages.value
    .filter((pkg) => {
      if (filters['exclude-dts'] && pkg.resolved.module === 'dts')
        return true
      if (filters.excludes && filters.excludes.includes(pkg.spec))
        return true
      return false
    }))

  let changed = true
  while (changed) {
    changed = false
    for (const pkg of _all_packages.value) {
      if (excluded.has(pkg) || !pkg.dependents.size)
        continue
      let shouldExclude = true
      for (const parentSpec of pkg.dependents) {
        const parent = _all_packages_map.value.get(parentSpec)
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

  return excluded
})

const _avaliable_packages = computed(() => {
  return _all_packages.value
    .filter(pkg => !_excluded_packages.value.has(pkg))
})
const _avaliable_packages_map = computed(() => new Map(_avaliable_packages.value.map(i => [i.spec, i])))
const _avaliable_packages_versions = computed(() => buildVersionToPackagesMap(_avaliable_packages.value))

const _workspace_packages = computed(() => _avaliable_packages.value.filter(i => i.workspace))

const _filtered_packages = computed(() => Array.from((function *() {
  for (const pkg of _avaliable_packages.value) {
    if (filters.focus) {
      const shouldTake = filters.focus.includes(pkg.spec) || filters.focus.some(f => pkg.flatDependents.has(f))
      if (!shouldTake)
        continue
    }

    if (filters.modules) {
      const type = getModuleType(pkg)
      // dts is always included here, as it's controlled by the exclude-dts option
      if (!filters.modules.includes(type) && type !== 'dts')
        continue
    }

    if (filters.licenses && !filters.licenses.includes(pkg.resolved.license || ''))
      continue

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

    // TODO: better excludes
    if (filters['source-type']) {
      if (filters['source-type'] === 'prod' && !pkg.prod && !pkg.workspace)
        continue
      if (filters['source-type'] === 'dev' && !pkg.dev && !pkg.workspace)
        continue
    }
    yield pkg
  }
})()))

const _filtered_packages_versions = computed(() => buildVersionToPackagesMap(_filtered_packages.value))

export const payload = reactive({
  all: {
    packages: _all_packages,
    map: _all_packages_map,
    get: (spec: string) => _all_packages_map.value.get(spec),
  },
  excluded: {
    packages: _excluded_packages,
  },
  workspace: {
    packages: _workspace_packages,
  },
  avaliable: {
    packages: _avaliable_packages,
    map: _avaliable_packages_map,
    versions: _avaliable_packages_versions,
    get: (spec: string) => _avaliable_packages_map.value.get(spec),
  },
  filtered: {
    packages: _filtered_packages,
    versions: _filtered_packages_versions,
  },
})

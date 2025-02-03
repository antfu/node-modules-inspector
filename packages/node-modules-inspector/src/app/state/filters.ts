import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { useDebounce } from '@vueuse/core'
import pm from 'picomatch'
import { computed, reactive } from 'vue'
import { buildVersionToPackagesMap } from '~/utils/maps'
import { getModuleType } from '~/utils/module-type'
import { packageData } from './data'

export interface FilterOptions {
  'search': string
  'modules': null | PackageModuleType[]
  'focus': null | string[]
  'licenses': null | string[]
  'excludes': null | string[]
  'exclude-dts': boolean
  'source-type': null | 'prod' | 'dev'
}

export const filters = reactive<FilterOptions>({
  'search': '',
  'focus': null,
  'modules': null,
  'licenses': null,
  'excludes': null,
  'exclude-dts': true,
  'source-type': null,
})

export const FILTER_KEYS = [
  'search',
  'focus',
  'modules',
  'licenses',
  'excludes',
  'exclude-dts',
  'source-type',
] satisfies (keyof FilterOptions)[]

export const FILTER_KEYS_FULL = [
  ...FILTER_KEYS,
]

const debouncedSearch = useDebounce(computed(() => filters.search), 200)

export const activatedFilters = computed(() => FILTER_KEYS.filter(i => !!filters[i]))

export const avaliablePackages = computed(() => {
  // TODO: exclude packages
  let pkgs = Array.from(packageData.value?.packages.values() || [])
    .filter((pkg) => {
      if (filters.excludes && filters.excludes.some(i => pkg.name.includes(i)))
        return false
      return true
    })

  if (filters['exclude-dts'])
    pkgs = pkgs.filter(i => i.resolved.module !== 'dts')

  return pkgs
})

export const workspacePackages = computed(() => avaliablePackages.value.filter(i => i.workspace))

export const filteredPackages = computed(() => Array.from((function *() {
  for (const pkg of avaliablePackages.value) {
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

    if (debouncedSearch.value) {
      if (debouncedSearch.value.match(/[*[\]]/)) {
        if (!pm.isMatch(pkg.name, debouncedSearch.value))
          continue
      }
      else {
        if (!pkg.name.includes(debouncedSearch.value))
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

export const avaliablePackagesMap = computed(() => new Map(avaliablePackages.value.map(i => [i.spec, i])))
export const packageVersionsMap = computed(() => buildVersionToPackagesMap(avaliablePackages.value))
export const filteredPackageVersionsMap = computed(() => buildVersionToPackagesMap(filteredPackages.value))

export function getPackageFromSpec(spec: string): PackageNode | undefined {
  return avaliablePackagesMap.value.get(spec)
}

export const payload = reactive({
  avaliable: {
    packages: avaliablePackages,
    map: avaliablePackagesMap,
    versions: packageVersionsMap,
  },
  filtered: {
    packages: filteredPackages,
    versions: filteredPackageVersionsMap,
  },
})

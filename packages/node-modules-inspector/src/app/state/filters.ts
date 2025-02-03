import type { PackageModuleType } from 'node-modules-tools'
import { useDebounce } from '@vueuse/core'
import pm from 'picomatch'
import { computed, reactive } from 'vue'
import { getModuleType } from '../utils/module-type'
import { packageData } from './data'

export interface FilterOptions {
  search: string
  modules: null | PackageModuleType[]
  licenses: null | string[]
  excludes: null | string[]
  sourceType: null | 'prod' | 'dev'
}

export const FILTER_KEYS = [
  'search',
  'excludes',
  'modules',
  'licenses',
  'sourceType',
] satisfies (keyof FilterOptions)[]

export const FILTER_KEYS_FULL = [
  'search',
  ...FILTER_KEYS,
]

export const filters = reactive<FilterOptions>({
  search: '',
  modules: null,
  licenses: null,
  excludes: null,
  sourceType: null,
})

export const activatedFilters = computed(() => FILTER_KEYS.filter(i => !!filters[i]))

const debouncedSearch = useDebounce(computed(() => filters.search), 200)

export const avaliablePackages = computed(() => {
  // TODO: exclude packages
  return Array.from(packageData.value?.packages.values() || [])
})

export const workspacePackages = computed(() => avaliablePackages.value.filter(i => i.workspace))

export const filteredPackages = computed(() => Array.from((function *() {
  for (const pkg of packageData.value?.packages.values() || []) {
    if (filters.modules && !filters.modules.includes(getModuleType(pkg)))
      continue
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
    if (filters.excludes && filters.excludes.some(i => pkg.name.includes(i)))
      continue
    if (filters.sourceType) {
      if (filters.sourceType === 'prod' && !pkg.prod && !pkg.workspace)
        continue
      if (filters.sourceType === 'dev' && !pkg.dev && !pkg.workspace)
        continue
    }
    yield pkg
  }
})()))

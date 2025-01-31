import type { PackageModuleType } from 'node-modules-tools'
import { useDebounce } from '@vueuse/core'
import { computed, reactive } from 'vue'
import { packageData } from './data'

export interface FilterOptions {
  search: string
  module: null | PackageModuleType
  license: null | string
}

export const filters = reactive<FilterOptions>({
  search: '',
  module: null,
  license: null,
})

const debouncedSearch = useDebounce(computed(() => filters.search), 200)

export const filteredPackages = computed(() => Array.from((function *() {
  for (const pkg of packageData.value?.packages.values() || []) {
    if (filters.module && pkg.resolved.module !== filters.module)
      continue
    if (filters.license && pkg.resolved.license !== filters.license)
      continue
    if (debouncedSearch.value && !pkg.name.includes(debouncedSearch.value))
      continue
    yield pkg
  }
})()))

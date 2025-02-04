import type { PackageModuleType } from 'node-modules-tools'
import { useDebounce } from '@vueuse/core'
import { computed, reactive } from 'vue'

export interface FilterOptions {
  'search': string
  'modules': null | PackageModuleType[]
  'focus': null | string[]
  'licenses': null | string[]
  'excludes': null | string[]
  'exclude-dts': boolean
  'exclude-private': boolean
  'source-type': null | 'prod' | 'dev'
}

export const filters = reactive<FilterOptions>({
  'search': '',
  'focus': null,
  'modules': null,
  'licenses': null,
  'excludes': null,
  'exclude-dts': false,
  'exclude-private': false,
  'source-type': null,
})

export const FILTER_KEYS = [
  'search',
  'focus',
  'modules',
  'licenses',
  'source-type',
] satisfies (keyof FilterOptions)[]

export const FILTER_KEYS_ARRAY = [
  'modules',
  'focus',
  'licenses',
  'excludes',
] satisfies (keyof FilterOptions)[]

export const FILTER_KEYS_FULL = [
  'excludes',
  'exclude-dts',
  'exclude-private',
  ...FILTER_KEYS,
] satisfies (keyof FilterOptions)[]

export const filterSearchDebounced = useDebounce(computed(() => filters.search), 200)
export const filtersActivated = computed(() => FILTER_KEYS.filter(i => !!filters[i]))

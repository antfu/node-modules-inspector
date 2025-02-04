import type { PackageModuleType } from 'node-modules-tools'
import { useDebounce } from '@vueuse/core'
import { computed, reactive } from 'vue'

export interface FilterOptions {
  'search': string
  'modules': null | PackageModuleType[]
  'focus': null | string[]
  'excludes': null | string[]
  'exclude-dts': boolean
  'exclude-private': boolean
  'source-type': null | 'prod' | 'dev'
}

export const FILTERS_DEFAULT: FilterOptions = Object.freeze({
  'search': '',
  'focus': null,
  'modules': null,
  'excludes': null,
  'exclude-dts': true,
  'exclude-private': false,
  'source-type': null,
})

export const filters = reactive<FilterOptions>({ ...FILTERS_DEFAULT })

export const FILTER_KEYS_INDACTORS = [
  'search',
  'focus',
  'modules',
  'source-type',
] satisfies (keyof FilterOptions)[]

export const FILTER_KEYS_EXCLUDES = [
  'excludes',
  'exclude-dts',
  'exclude-private',
] satisfies (keyof FilterOptions)[]

export const FILTERS_SCHEMA: Record<keyof FilterOptions, StringConstructor | ArrayConstructor | BooleanConstructor> = {
  'search': String,
  'modules': Array,
  'focus': Array,
  'excludes': Array,
  'exclude-dts': Boolean,
  'exclude-private': Boolean,
  'source-type': String,
}

export const FILTER_KEYS_FULL = Object.keys(FILTERS_DEFAULT) as (keyof FilterOptions)[]

export const filterSearchDebounced = useDebounce(computed(() => filters.search), 200)
export const filtersActivated = computed(() => FILTER_KEYS_INDACTORS.filter(i => filters[i] !== FILTERS_DEFAULT[i]))
export const filtersExcludesActivated = computed(() => FILTER_KEYS_EXCLUDES.filter(i => filters[i] !== FILTERS_DEFAULT[i]))

import type { PackageModuleType } from 'node-modules-tools'
import { objectMap } from '@antfu/utils'
import { objectEntries, useDebounce } from '@vueuse/core'
import { computed, reactive } from 'vue'

export interface FilterOptions {
  'mode': 'text' | 'license' | 'author'
  'search': string
  'modules': null | PackageModuleType[]
  'focus': null | string[]
  'why': null | string[]
  'excludes': null | string[]
  'exclude-dts': boolean
  'exclude-private': boolean
  'source-type': null | 'prod' | 'dev'
}

export interface FilterSchema<Type> {
  type: StringConstructor | ArrayConstructor | BooleanConstructor
  default: Type
  category: 'filter' | 'exclude'
}

export const FILTERS_SCHEMA: {
  [x in keyof FilterOptions]: FilterSchema<FilterOptions[x]>
} = {
  'search': { type: String, default: '', category: 'filter' },
  'modules': { type: Array, default: null, category: 'filter' },
  'focus': { type: Array, default: null, category: 'filter' },
  'why': { type: Array, default: null, category: 'filter' },
  'source-type': { type: String, default: null, category: 'filter' },

  // Excludes
  'excludes': { type: Array, default: null, category: 'exclude' },
  'exclude-dts': { type: Boolean, default: true, category: 'exclude' },
  'exclude-private': { type: Boolean, default: false, category: 'exclude' },
}

export const FILTERS_DEFAULT: FilterOptions = Object.freeze(objectMap(FILTERS_SCHEMA, (k, v) => [k, v.default]) as FilterOptions)

export const filters = reactive<FilterOptions>({ ...FILTERS_DEFAULT })

export const FILTER_KEYS_FILTERS = objectEntries(FILTERS_SCHEMA)
  .filter(([_, v]) => v.category === 'filter')
  .map(([k]) => k) as (keyof FilterOptions)[]

export const FILTER_KEYS_EXCLUDES = objectEntries(FILTERS_SCHEMA)
  .filter(([_, v]) => v.category === 'exclude')
  .map(([k]) => k) as (keyof FilterOptions)[]

export const FILTER_KEYS_FULL = Object.keys(FILTERS_SCHEMA) as (keyof FilterOptions)[]

export const filterSearchDebounced = useDebounce(computed(() => filters.search), 200)
export const filtersActivated = computed(() => FILTER_KEYS_FILTERS.filter(i => filters[i] !== FILTERS_DEFAULT[i]))
export const excludesActivated = computed(() => FILTER_KEYS_EXCLUDES.filter(i => filters[i] !== FILTERS_DEFAULT[i]))

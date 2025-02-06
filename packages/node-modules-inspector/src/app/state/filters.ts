import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { objectMap } from '@antfu/utils'
import { objectEntries, useDebounce } from '@vueuse/core'
import { computed, reactive } from 'vue'
import { getModuleType } from '../utils/module-type'
import { parseSearch } from '../utils/search-parser'

export interface FilterOptions {
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
  category: 'select' | 'exclude'
}

export const FILTERS_SCHEMA: {
  [x in keyof FilterOptions]: FilterSchema<FilterOptions[x]>
} = {
  'search': { type: String, default: '', category: 'select' },
  'modules': { type: Array, default: null, category: 'select' },
  'focus': { type: Array, default: null, category: 'select' },
  'why': { type: Array, default: null, category: 'select' },
  'source-type': { type: String, default: null, category: 'select' },

  // Excludes
  'excludes': { type: Array, default: null, category: 'exclude' },
  'exclude-dts': { type: Boolean, default: true, category: 'exclude' },
  'exclude-private': { type: Boolean, default: false, category: 'exclude' },
}

export const FILTERS_DEFAULT: FilterOptions = Object.freeze(objectMap(FILTERS_SCHEMA, (k, v) => [k, v.default]) as FilterOptions)

export const FILTER_KEYS_SELECT = objectEntries(FILTERS_SCHEMA)
  .filter(([_, v]) => v.category === 'select')
  .map(([k]) => k) as (keyof FilterOptions)[]

export const FILTER_KEYS_EXCLUDES = objectEntries(FILTERS_SCHEMA)
  .filter(([_, v]) => v.category === 'exclude')
  .map(([k]) => k) as (keyof FilterOptions)[]

export const FILTER_KEYS_FULL = Object.keys(FILTERS_SCHEMA) as (keyof FilterOptions)[]

const state = reactive<FilterOptions>({ ...FILTERS_DEFAULT })
const searchDebounced = useDebounce(computed(() => state.search), 200)
const searchParsed = computed(() => parseSearch(searchDebounced.value))

export function filtersExcludePredicate(pkg: PackageNode) {
  if (state['exclude-dts'] && pkg.resolved.module === 'dts')
    return true
  if (state['exclude-dts'] && pkg.resolved.module === 'dts')
    return true
  if (state['exclude-private'] && pkg.private)
    return true
  if (state.excludes && state.excludes.includes(pkg.spec))
    return true
  return false
}

export const filterSelectPredicate = computed(() => {
  const predicates: ((pkg: PackageNode) => boolean | undefined)[] = []

  if (state.focus) {
    predicates.push(pkg => state.focus!.includes(pkg.spec) || state.focus!.some(f => pkg.flatDependents.has(f)))
  }

  if (state.why) {
    predicates.push(pkg => state.why!.includes(pkg.spec) || state.why!.some(f => pkg.flatDependencies.has(f)))
  }

  if (state['source-type']) {
    predicates.push((pkg) => {
      if (state['source-type'] === 'prod')
        return pkg.prod || pkg.workspace
      if (state['source-type'] === 'dev')
        return pkg.dev || pkg.workspace
      return true
    })
  }

  predicates.push((pkg) => {
    const type = getModuleType(pkg)
    // dts is always included here, as it's controlled by the exclude-dts option
    if (type === 'dts')
      return true
    if (state.modules)
      return state.modules.includes(type)
    return true
  })

  if (searchDebounced.value.trim()) {
    const parsed = searchParsed.value
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

  return (pkg: PackageNode) => predicates.every(i => i(pkg))
})

export function createToggle(key: 'focus' | 'why' | 'excludes') {
  return (value: string, toggle?: boolean) => {
    const current = state[key] || []

    // Invert if not specified
    if (toggle === undefined)
      toggle = !current.includes(value)

    // No change
    if (toggle && current.includes(value))
      return
    if (!toggle && !current.includes(value))
      return

    if (toggle) {
      state[key] = [...current, value]
    }
    else {
      const filtered = current.filter(i => i !== value)
      if (filtered.length)
        state[key] = filtered
      else
        state[key] = null
    }
  }
}

export const filters = reactive({
  state,
  search: {
    raw: searchDebounced,
    parsed: searchParsed,
  },
  focus: {
    toggle: createToggle('focus'),
  },
  why: {
    toggle: createToggle('why'),
  },
  excludes: {
    toggle: createToggle('excludes'),
  },
  select: {
    reset: () => {
      for (const key of FILTER_KEYS_SELECT) {
        // @ts-expect-error any
        state[key] = FILTERS_DEFAULT[key]
      }
    },
    activated: computed(() => FILTER_KEYS_SELECT.filter(i => state[i] !== FILTERS_DEFAULT[i])),
  },
  exclude: {
    reset: () => {
      for (const key of FILTER_KEYS_EXCLUDES) {
        // @ts-expect-error any
        state[key] = FILTERS_DEFAULT[key]
      }
    },
    activated: computed(() => FILTER_KEYS_EXCLUDES.filter(i => state[i] !== FILTERS_DEFAULT[i])),
  },
})

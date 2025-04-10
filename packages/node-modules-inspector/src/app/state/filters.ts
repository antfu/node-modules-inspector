import type { PackageNode } from 'node-modules-tools'
import type { FilterOptions } from '../../shared/filters'
import { objectMap } from '@antfu/utils'
import { objectEntries, useDebounce } from '@vueuse/core'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_PROD } from 'node-modules-tools/constants'
import { constructPackageFilters } from 'node-modules-tools/utils'
import { computed, reactive, toRaw } from 'vue'
import { FILTERS_SCHEMA } from '../../shared/filters'
import { getModuleType } from '../utils/module-type'
import { getAuthors, getPackageData } from '../utils/package-json'
import { parseSearch } from '../utils/search-parser'
import { rawPayload } from './data'

export * from '../../shared/filters'

const FILTERS_DEFAULT: FilterOptions = Object.freeze(objectMap(FILTERS_SCHEMA, (k, v) => [k, v.default]) as FilterOptions)

export const filtersDefault = computed<FilterOptions>(() => {
  return {
    ...FILTERS_DEFAULT,
    ...rawPayload.value?.config?.defaultFilters || {},
  }
})

export const FILTER_KEYS_SELECT = objectEntries(FILTERS_SCHEMA)
  .filter(([_, v]) => v.category === 'select')
  .map(([k]) => k) as (keyof FilterOptions)[]

export const FILTER_KEYS_EXCLUDES = objectEntries(FILTERS_SCHEMA)
  .filter(([_, v]) => v.category === 'exclude')
  .map(([k]) => k) as (keyof FilterOptions)[]

export const FILTER_KEYS_FULL = Object.keys(FILTERS_SCHEMA) as (keyof FilterOptions)[]

const state = reactive<FilterOptions>(filtersDefault.value)
const searchDebounced = useDebounce(computed(() => state.search), 200)
const searchParsed = computed(() => parseSearch(searchDebounced.value))

const filtersExclude = computed(() => state.excludes?.length ? constructPackageFilters(state.excludes, 'some') : () => false)
const filtersFocus = computed(() => state.focus?.length ? constructPackageFilters(state.focus, 'some') : () => false)
const filtersWhy = computed(() => state.why?.length ? constructPackageFilters(state.why, 'some') : () => false)

export function filtersExcludePredicate(pkg: PackageNode) {
  if (state.excludeDts && pkg.resolved.module === 'dts')
    return true
  if (state.excludeDts && pkg.resolved.module === 'dts')
    return true
  if (state.excludeOptional && !pkg.filepath)
    return true
  if (state.excludePrivate && pkg.private)
    return true
  if (state.excludes?.length) {
    return filtersExclude.value(pkg)
  }
  return false
}

export const filterSelectPredicate = computed(() => {
  const predicates: ((pkg: PackageNode) => boolean | undefined)[] = []

  if (state.focus) {
    // TODO: flatDependents use filtersFocus
    predicates.push(pkg => filtersFocus.value(pkg) || state.focus!.some(f => pkg.flatDependents.has(f)))
  }

  if (state.why) {
    predicates.push(pkg => filtersWhy.value(pkg) || state.why!.some(f => pkg.flatDependencies.has(f)))
  }

  if (state.depths?.length) {
    const depths = state.depths.map(i => typeof i === 'string' ? Number.parseInt(i) : i)
    predicates.push((pkg) => {
      if (pkg.depth === undefined)
        return false
      return depths.includes(pkg.depth)
    })
  }

  if (state.sourceType) {
    predicates.push((pkg) => {
      if (state.sourceType === 'prod')
        return pkg.flatClusters.has(CLUSTER_DEP_PROD) || pkg.workspace
      if (state.sourceType === 'dev')
        return pkg.flatClusters.has(CLUSTER_DEP_DEV) || pkg.workspace
      return true
    })
  }

  if (state.clusters) {
    predicates.push((pkg) => {
      return (state.clusters || [])[state.clustersMode === 'or' ? 'some' : 'every'](c => pkg.flatClusters.has(c))
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
        const license = getPackageData(pkg).license
        if (!license)
          return false
        for (const re of parsed.license) {
          if (!re.test(license))
            return false
        }
      }
      if (parsed.author?.length) {
        const authors = getAuthors(pkg)
        if (!authors)
          return false
        for (const re of parsed.author) {
          if (authors.some(a => re.test(a.name)))
            return true
        }
        return false
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

export function isDeepEqual(a: any, b: any) {
  if (a === b)
    return true
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length)
      return false
    return a.every((v, i) => v === b[i])
  }
  return false
}

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
        state[key] = structuredClone(toRaw(filtersDefault.value[key]))
      }
    },
    activated: computed(() => FILTER_KEYS_SELECT.filter(i => !isDeepEqual(state[i], filtersDefault.value[i]))),
  },
  exclude: {
    reset: () => {
      for (const key of FILTER_KEYS_EXCLUDES) {
        // @ts-expect-error any
        state[key] = structuredClone(toRaw(filtersDefault.value[key]))
      }
    },
    activated: computed(() => FILTER_KEYS_EXCLUDES.filter(i => !isDeepEqual(state[i], filtersDefault.value[i]))),
  },
})

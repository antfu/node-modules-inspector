import type { FilterOptions } from './filters'
import { useRoute, useRouter } from '#app/composables/router'
import { objectEntries } from '@antfu/utils'
import { debouncedWatch, ignorableWatch } from '@vueuse/core'
import { reactive, watch } from 'vue'
import { filters, FILTERS_SCHEMA, filtersDefault, isDeepEqual } from './filters'

export interface QueryOptions extends Partial<{ [x in keyof FilterOptions]?: string }> {
  selected?: string
  install?: string
}

export const query = reactive<QueryOptions>({
  selected: '',
  install: '',
} as any)

function camelCase(str: string) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function kebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, (_, a, b) => `${a}-${b.toLowerCase()}`)
}

function stringifyQuery(object: QueryOptions): string {
  const entries = Object.entries(object)
    .map(i => [kebabCase(i[0]), Array.isArray(i[1]) ? i[1].join('+') : i[1]])
    .filter(x => !!x[1]) as [string, string][]
  const query = new URLSearchParams(entries)
  return query.toString()
}

function parseQuery(query: string): QueryOptions {
  return Object.fromEntries(
    Array.from(new URLSearchParams(query).entries())
      .map(([key, value]) => [
        camelCase(key),
        value === null
          ? 'true'
          : typeof value === 'string'
            ? value
            : String(value),
      ]),
  ) as any as QueryOptions
}

function queryToFilters(query: QueryOptions, filters: FilterOptions) {
  for (const [key, s] of objectEntries(FILTERS_SCHEMA)) {
    const raw = query[key]

    const resolved = !raw
      ? structuredClone(filtersDefault.value[key])
      : s.type === Array
        ? raw.split(/[,+]/)
        : s.type === Boolean
          ? raw === 'true'
          : raw

    if (filters[key] !== resolved)
      (filters as any)[key] = resolved
  }
}

function filtersToQuery(filters: FilterOptions, query: QueryOptions) {
  for (const [key, s] of objectEntries(FILTERS_SCHEMA)) {
    const value = filters[key]
    const serialized = (isDeepEqual(value, filtersDefault.value[key]) || value === null)
      ? undefined
      : s.type === Array
        ? (value as any)?.join(',')
        : s.type === Boolean
          ? (value ? 'true' : 'false')
          : value

    if (query[key] !== serialized)
      (query as any)[key] = serialized
  }
}

let _isQuerySetup = false

export function setupQuery() {
  if (_isQuerySetup)
    return
  _isQuerySetup = true
  Object.assign(query, parseQuery(location.hash.replace(/^#/, '')))
  queryToFilters(query, filters.state)

  const router = useRouter()
  const route = useRoute()

  const { ignoreUpdates } = ignorableWatch(
    () => [query, query.selected],
    (n, o) => {
      const hash = `#${decodeURIComponent(stringifyQuery(query)).replace(/^\?/g, '')}`
      if (n[1] !== o[1])
        router.push({ path: route.path, hash })
      else
        history.replaceState(history.state, '', hash)
    },
    { deep: true, flush: 'post' },
  )

  watch(
    () => route.hash,
    () => {
      ignoreUpdates(() => {
        Object.assign(query, parseQuery(location.hash.replace(/^#/, '')))
      })
    },
  )

  debouncedWatch(
    () => filters.state,
    () => {
      filtersToQuery(filters.state, query)
    },
    { deep: true, debounce: 200 },
  )
}

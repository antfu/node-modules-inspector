import type { FilterOptions } from './filters'
import { useRoute, useRouter } from '#app/composables/router'
import { debouncedWatch, ignorableWatch } from '@vueuse/core'
import { reactive, watch } from 'vue'
import { FILTER_KEYS_ARRAY, FILTER_KEYS_FULL, filters } from './filters'

export interface QueryOptions extends FilterOptions {
  selected?: string
}

export const query = reactive<QueryOptions>({
  selected: '',
} as any)

function stringifyQuery(object: QueryOptions): string {
  const entries = Object.entries(object)
    .map(i => [i[0], Array.isArray(i[1]) ? i[1].join(',') : i[1]])
    .filter(x => !!x[1]) as [string, string][]
  const query = new URLSearchParams(entries)
  return query.toString()
}

function parseQuery(query: string): QueryOptions {
  return Object.fromEntries(
    Array.from(new URLSearchParams(query).entries())
      .map(([key, value]) => [key, (FILTER_KEYS_ARRAY.includes(key as any) && typeof value === 'string') ? value.split(',') : value]),
  ) as any as QueryOptions
}

export function setupQuery() {
  Object.assign(query, parseQuery(location.hash.replace(/^#/, '')))

  FILTER_KEYS_FULL.forEach((key) => {
    if (query[key] === undefined)
      (filters as any)[key] = query[key]
  })

  const router = useRouter()
  const route = useRoute()

  const { ignoreUpdates } = ignorableWatch(
    () => [query, query.selected],
    (n, o) => {
      const hash = `#${decodeURIComponent(stringifyQuery(query)).replace(/^\?/g, '')}`
      if (n[1] !== o[1])
        router.push({ path: route.path, hash })
      else
        history.replaceState(null, '', hash)
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
    filters,
    () => {
      for (const key of FILTER_KEYS_FULL) {
        if (query[key] !== filters[key])
          (query as any)[key] = filters[key]
      }
    },
    { deep: true, debounce: 200 },
  )
}

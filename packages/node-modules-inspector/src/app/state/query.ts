import type { LocationQuery } from 'vue-router'
import type { FilterOptions } from './filters'
import { useRoute, useRouter } from '#app/composables/router'
import { debouncedWatch, ignorableWatch } from '@vueuse/core'
import { reactive, watch } from 'vue'
import { FILTER_KEYS, filters } from './filters'

export interface QueryOptions extends FilterOptions {
  selected?: string
}

export const query = reactive<QueryOptions>({} as any)

const FIELDS_ARRAY: (keyof QueryOptions)[] = [
  'modules',
  'focus',
  'licenses',
  'excludes',
]

// function stringifyQuery(object: QueryOptions): string {
//   const entries = Object.entries(object)
//     .map(i => [i[0], Array.isArray(i[1]) ? i[1].join(',') : i[1]])
//     .filter(x => !!x[1]) as [string, string][]
//   const query = new URLSearchParams(entries)
//   return query.toString()
// }

function parseQuery(query: string): QueryOptions {
  return Object.fromEntries(
    Array.from(new URLSearchParams(query).entries())
      .map(([key, value]) => [key, (FIELDS_ARRAY.includes(key as any) && typeof value === 'string') ? value.split(',') : value]),
  ) as any as QueryOptions
}

function toVueRouterQuery(query: QueryOptions): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])
      .filter(x => !!x[1]),
  )
}

function fromVueRouterQuery(query: LocationQuery): QueryOptions {
  return Object.fromEntries(
    Object.entries(query)
      .map(([key, value]) => [key, (FIELDS_ARRAY.includes(key as any) && typeof value === 'string') ? value.split(',') : value]),
  ) as any as QueryOptions
}

export function setupQuery() {
  Object.assign(query, parseQuery(location.search))
  Object.assign(filters, query)

  const router = useRouter()
  const route = useRoute()

  const { ignoreUpdates } = ignorableWatch(
    query,
    () => {
      router.push({ path: route.path, query: toVueRouterQuery(query) })
    },
    { deep: true, flush: 'post' },
  )

  watch(
    () => route.query,
    (after) => {
      ignoreUpdates(() => {
        const target = fromVueRouterQuery(after)
        for (const [key, value] of Object.entries(target)) {
          if ((query as any)[key] !== value) {
            (query as any)[key] = value
          }
        }
      })
    },
    { deep: true },
  )

  debouncedWatch(
    filters,
    () => {
      for (const key of FILTER_KEYS) {
        if (query[key] !== filters[key])
          (query as any)[key] = filters[key]
      }
    },
    { deep: true, debounce: 500 },
  )
}

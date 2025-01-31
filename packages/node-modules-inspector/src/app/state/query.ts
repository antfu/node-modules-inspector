import type { FilterOptions } from './search'
import { useRoute, useRouter } from '#app/composables/router'
import { debouncedWatch, ignorableWatch } from '@vueuse/core'
import { reactive, watch } from 'vue'
import { filters } from './search'

export interface QueryOptions extends FilterOptions {
  selected?: string
}

export const query = reactive<QueryOptions>({} as any)

export function setupQuery() {
  const initialQuery = new URLSearchParams(location.search)
  Object.assign(query, Object.fromEntries(initialQuery.entries()) as any as QueryOptions)
  Object.assign(filters, query)

  const router = useRouter()
  const route = useRoute()

  const { ignoreUpdates } = ignorableWatch(
    query,
    () => {
      const entries = Object.entries(query).filter(([, value]) => value)
      router.push({ path: route.path, query: Object.fromEntries(entries) })
    },
    { deep: true, flush: 'post' },
  )

  watch(
    () => route.query,
    (after) => {
      ignoreUpdates(() => {
        for (const [key, value] of Object.entries(after)) {
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
      Object.assign(query, filters)
    },
    { deep: true, debounce: 500 },
  )
}

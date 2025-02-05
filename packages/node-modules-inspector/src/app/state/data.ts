import type { ListPackageDependenciesResult } from 'node-modules-tools'
import { useAsyncState } from '@vueuse/core'
import { shallowRef } from 'vue'
import { ensureBackend } from '~/backends'

export const rawData = shallowRef<ListPackageDependenciesResult | null>(null)

export function fetchListDependenciesData() {
  const { state } = useAsyncState(async () => {
    const backend = await ensureBackend()
    const data = await backend.functions.listDependencies()

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawData.value = data

    return rawData.value
  }, null)
  return state
}

import type { ListPackageDependenciesResult } from 'node-modules-tools'
import { useAsyncState } from '@vueuse/core'
import { shallowRef } from 'vue'
import { getBackend } from '~/backends'

export const rawData = shallowRef<ListPackageDependenciesResult | null>(null)

export function fetchListDependenciesData() {
  const backend = getBackend()
  const { state } = useAsyncState(async () => {
    const data = await backend.functions.listDependencies()

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawData.value = data

    return rawData.value
  }, null)
  return state
}

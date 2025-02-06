import type { ListPackageDependenciesResult } from 'node-modules-tools'
import { shallowRef } from 'vue'
import { ensureBackend } from '~/backends'

export const rawPublishDates = shallowRef<Map<string, string> | null>(null)

export async function fetchPublishDates(deps: ListPackageDependenciesResult) {
  rawPublishDates.value = null
  const backend = await ensureBackend()
  try {
    const data = await backend.functions.getPackagesPublishDate(deps)
    Object.freeze(data)
    rawPublishDates.value = data
    return rawPublishDates.value
  }
  catch (err) {
    backend.connectionError.value = err
    rawPublishDates.value = null
    return null
  }
}

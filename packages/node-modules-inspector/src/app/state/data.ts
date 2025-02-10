import type { ListPackageDependenciesResult } from 'node-modules-tools'
import { shallowRef } from 'vue'
import { getBackend } from '~/backends'

export const rawData = shallowRef<ListPackageDependenciesResult | null>(null)
export const rawPublishDates = shallowRef<Map<string, string> | null>(null)

export async function fetchData() {
  rawData.value = null
  const backend = getBackend()
  try {
    const data = await backend.functions.listDependencies()

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawData.value = data

    const publishDate = await backend.functions.getPackagesPublishDate?.([...data.packages.keys()])
    if (publishDate) {
      Object.freeze(publishDate)
      rawPublishDates.value = publishDate
    }

    return rawData.value
  }
  catch (err) {
    console.error(err)
    if (backend)
      backend.connectionError.value = err
    rawData.value = null
    return null
  }
}

import type { NodeModulesInspectorPayload } from '~~/shared/types'
import { shallowRef, toRaw } from 'vue'
import { getBackend } from '~/backends'
import { filters, filtersDefault } from './filters'
import { setupQuery } from './query'
import { settings } from './settings'

export const rawData = shallowRef<NodeModulesInspectorPayload | null>(null)
export const rawPublishDates = shallowRef<Map<string, string> | null>(null)

export async function fetchData(force = false) {
  rawData.value = null
  const backend = getBackend()
  try {
    const data = await backend.functions.getPayload(force)

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawData.value = data

    Object.assign(settings.value, structuredClone(toRaw(data.config?.defaultSettings || {})))
    Object.assign(filters.state, structuredClone(toRaw(filtersDefault.value)))

    const publishDate = await backend.functions.getPackagesPublishDate?.(
      [...data.packages.entries()]
        .filter(x => !x[1].private && !x[1].workspace)
        .map(x => x[0]),
    )
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
  finally {
    setupQuery()
  }
}

import type { NodeModulesInspectorPayload } from '~~/shared/types'
import { shallowRef, toRaw } from 'vue'
import { getBackend } from '~/backends'
import { filters, filtersDefault } from './filters'
import { settings } from './settings'

export const rawPayload = shallowRef<NodeModulesInspectorPayload | null>(null)
export const rawReferencePayload = shallowRef<NodeModulesInspectorPayload | null>(null)
export const rawPublishDates = shallowRef<Map<string, string> | null>(null)

export async function fetchData(force = false) {
  rawPayload.value = null
  const backend = getBackend()
  try {
    const data = await backend.functions.getPayload(force)

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawPayload.value = data

    Object.assign(settings.value, structuredClone(toRaw(data.config?.defaultSettings || {})))
    Object.assign(filters.state, structuredClone(toRaw(filtersDefault.value)))

    const publishDate = await backend.functions.getPackagesPublishDate?.(
      [...data.packages.entries()]
        .filter(x => !x[1].private && !x[1].workspace && !x[1].resolved.publishTime)
        .map(x => x[0]),
    )
    if (publishDate) {
      Object.freeze(publishDate)
      rawPublishDates.value = publishDate
    }

    return rawPayload.value
  }
  catch (err) {
    console.error(err)
    if (backend)
      backend.connectionError.value = err
    rawPayload.value = null
    return null
  }
}

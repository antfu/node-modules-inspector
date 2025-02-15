import type { ListPackageDependenciesResult } from 'node-modules-tools'
import type { NodeModulesInspectorConfig } from '~~/shared/types'
import { shallowRef, toRaw } from 'vue'
import { getBackend } from '~/backends'
import { filters, filtersDefault } from './filters'
import { setupQuery } from './query'
import { settings } from './settings'

export const rawConfig = shallowRef<NodeModulesInspectorConfig | null>(null)
export const rawData = shallowRef<ListPackageDependenciesResult | null>(null)
export const rawPublishDates = shallowRef<Map<string, string> | null>(null)

export async function fetchData() {
  rawData.value = null
  const backend = getBackend()
  try {
    backend.functions.getConfig?.()
      .then((config) => {
        rawConfig.value = config
        Object.assign(settings.value, structuredClone(toRaw(config.defaultSettings || {})))
        Object.assign(filters.state, structuredClone(toRaw(filtersDefault.value)))
      })
      .catch(e => console.error(e))

    const data = await backend.functions.listDependencies()

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawData.value = data

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

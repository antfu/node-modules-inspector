import type { ListPackageDependenciesResult } from 'node-modules-tools'
import { shallowRef } from 'vue'
import { ensureBackend } from '~/backends'

export const rawData = shallowRef<ListPackageDependenciesResult | null>(null)

export async function fetchData() {
  rawData.value = null
  const backend = await ensureBackend()
  try {
    const data = await backend.functions.listDependencies()
    // const data2 = await backend.functions.dependenciesPublishDate()
    // console.log(data2)
    // console.log(data2.get("unstorage@1.14.4"))

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawData.value = data

    return rawData.value
  }
  catch (err) {
    backend.connectionError.value = err
    rawData.value = null
    return null
  }
}

import type { ListPackageDependenciesResult, PackageNode } from 'node-modules-tools'
import { useAsyncState } from '@vueuse/core'
import { shallowRef } from 'vue'
import { rpc } from '../composables/rpc'

export const packageData = shallowRef<ListPackageDependenciesResult | null>(null)

export function fetchListDependenciesData() {
  const { state } = useAsyncState(async () => {
    const data = await rpc.listDependencies()

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    packageData.value = data

    return packageData.value
  }, null)
  return state
}

export function getPackageFromSpec(spec: string): PackageNode | undefined {
  return packageData.value?.packages.get(spec)
}

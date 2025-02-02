import type { ListPackageDependenciesResult, PackageNode } from 'node-modules-tools'
import { useAsyncState } from '@vueuse/core'
import { shallowReactive, shallowRef } from 'vue'
import { rpc } from '../composables/rpc'

export const packageData = shallowRef<ListPackageDependenciesResult | null>(null)
export const packageVersionsMap = shallowReactive(new Map<string, PackageNode[]>())

export function fetchListDependenciesData() {
  const { state } = useAsyncState(async () => {
    const data = await rpc.listDependencies()

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    packageData.value = data
    packageVersionsMap.clear()
    for (const pkg of packageData.value?.packages.values() || []) {
      if (!packageVersionsMap.has(pkg.name))
        packageVersionsMap.set(pkg.name, [])
      packageVersionsMap.get(pkg.name)!.push(pkg)
    }

    return packageData.value
  }, null)
  return state
}

export function getPackageFromSpec(spec: string): PackageNode | undefined {
  return packageData.value?.packages.get(spec)
}

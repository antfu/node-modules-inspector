import type { ListPackageDependenciesResult, ResolvedPackageNode } from 'node-modules-tools'
import { useAsyncState } from '@vueuse/core'
import { shallowReactive, shallowRef } from 'vue'
import { rpc } from '../composables/rpc'

export const packageData = shallowRef<ListPackageDependenciesResult | null>(null)
export const packageVersionsMap = shallowReactive(new Map<string, ResolvedPackageNode[]>())

export function fetchListDependenciesData() {
  const { state } = useAsyncState(async () => {
    packageData.value = await rpc.listDependencies()

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

export function getPackageFromSpec(spec: string): ResolvedPackageNode | undefined {
  return packageData.value?.packages.get(spec)
}

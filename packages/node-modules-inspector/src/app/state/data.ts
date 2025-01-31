import type { ListPackageDependenciesResult, ResolvedPackageNode } from 'node-modules-tools'
import { useAsyncState } from '@vueuse/core'
import { shallowRef } from 'vue'
import { rpc } from '../composables/rpc'

export const packageData = shallowRef<ListPackageDependenciesResult | null>(null)
export const packageSpecMap = new Map<string, ResolvedPackageNode>()

export function fetchListDependenciesData() {
  const { state } = useAsyncState(async () => {
    packageData.value = await rpc.listDependencies()
    packageSpecMap.clear()
    packageData.value.packages.forEach(i => packageSpecMap.set(i.spec, i))
    return packageData.value
  }, null)
  return state
}

export function getPackageFromSpec(spec: string): ResolvedPackageNode | undefined {
  return packageSpecMap.get(spec)
}

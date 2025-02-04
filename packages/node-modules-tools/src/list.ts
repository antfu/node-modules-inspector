import type { ListPackageDependenciesOptions, ListPackageDependenciesResult } from './types'
import pLimit from 'p-limit'
import { getPackageManager } from './agent-entry/detect'
import { listPackageDependenciesRaw } from './agent-entry/list'
import { resolvePackage } from './resolve'

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesResult> {
  const packageManager = await getPackageManager(options)
  const result = await listPackageDependenciesRaw(packageManager, options) as ListPackageDependenciesResult
  const limit = pLimit(10)
  await Promise.all(Array.from(result.packages.values()).map(pkg => limit(() => resolvePackage(packageManager, pkg, options))))
  return result
}

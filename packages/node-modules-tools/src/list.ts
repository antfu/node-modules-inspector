import type { ListPackageDependenciesOptions, ListPackageDependenciesResult } from './types'
import pLimit from 'p-limit'
import { getPackageManager } from './agent-entry/detect'
import { listPackageDependenciesRaw } from './agent-entry/list'
import { populateRawResult } from './graph'
import { resolvePackage } from './resolve'

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesResult> {
  const packageManager = await getPackageManager(options)
  const raw = await listPackageDependenciesRaw(packageManager, options)
  const limit = pLimit(10)
  // Must resolve each package's manifest (which detects peer-dependency
  // edges) before `populateRawResult`, so peer edges can be excluded from
  // `flatDependencies` / depth traversal.
  await Promise.all(Array.from(raw.packages.values()).map(pkg => limit(() => resolvePackage(packageManager, pkg, options))))
  return populateRawResult(raw) as ListPackageDependenciesResult
}

import type { AgentName } from 'package-manager-detector'
import type { ListPackageDependenciesBaseResult, ListPackageDependenciesOptions, ListPackageDependenciesRawResult } from '../types'
import { populateRawResult } from '../graph'

/**
 * List dependencies of packages in the current project.
 *
 * This function will automatically detect the package manager in the current project, and list the dependencies of the packages.
 */
export async function listPackageDependenciesRaw(
  manager: AgentName,
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesBaseResult> {
  let result: ListPackageDependenciesRawResult
  if (manager === 'pnpm')
    result = await import('../agents/pnpm').then(r => r.listPackageDependencies(options))
  else if (manager === 'npm')
    result = await import('../agents/npm').then(r => r.listPackageDependencies(options))
  else if (manager === 'bun')
    result = await import('../agents/bun').then(r => r.listPackageDependencies(options))
  else
    throw new Error(`Package manager ${manager} is not yet supported`)

  return populateRawResult(result)
}

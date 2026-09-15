import type { AgentName } from 'package-manager-detector'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult } from '../types'

/**
 * List dependencies of packages in the current project.
 *
 * This function will automatically detect the package manager in the current project, and list the dependencies of the packages.
 */
export async function listPackageDependenciesRaw(
  manager: AgentName,
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  if (manager === 'pnpm')
    return await import('../agents/pnpm').then(r => r.listPackageDependencies(options))
  if (manager === 'npm')
    return await import('../agents/npm').then(r => r.listPackageDependencies(options))
  if (manager === 'bun')
    return await import('../agents/bun').then(r => r.listPackageDependencies(options))
  throw new Error(`Package manager ${manager} is not yet supported`)
}

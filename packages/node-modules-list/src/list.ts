import type { ListPackageDependenciesOptions, ListPackageDependenciesResult } from './types'
import { detect } from 'package-manager-detector'

/**
 * List dependencies of packages in the current project.
 *
 * This function will automatically detect the package manager in the current project, and list the dependencies of the packages.
 */
export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesResult> {
  const manager = await detect({
    cwd: options.cwd,
  })
  if (!manager)
    throw new Error('Cannot detect package manager in the current patch')
  if (manager.name === 'pnpm')
    return await import('./list/pnpm').then(r => r.listPackageDependencies(options))
  else
    throw new Error(`Package manager ${manager.name} is not yet supported`)
}

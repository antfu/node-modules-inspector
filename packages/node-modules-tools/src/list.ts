import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, ListPackageDependenciesResult, PackageNode } from './types'
import { detect } from 'package-manager-detector'
import { resolvePackage } from './resolve'

/**
 * List dependencies of packages in the current project.
 *
 * This function will automatically detect the package manager in the current project, and list the dependencies of the packages.
 */
export async function listPackageDependenciesRaw(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  const manager = await detect({
    cwd: options.cwd,
  })
  if (!manager)
    throw new Error('Cannot detect package manager in the current patch')

  let result: ListPackageDependenciesRawResult
  if (manager.name === 'pnpm')
    result = await import('./list/pnpm').then(r => r.listPackageDependencies(options))
  else
    throw new Error(`Package manager ${manager.name} is not yet supported`)

  function resloveFlatDependencies(pkg: PackageNode) {
    function traverseDependencies(node: PackageNode) {
      for (const dep of node.dependencies) {
        if (pkg.flatDependencies.has(dep))
          continue
        pkg.flatDependencies.add(dep)
        traverseDependencies(result.packages.get(dep)!)
      }
    }

    function traverseDependents(node: PackageNode) {
      for (const dep of node.dependents) {
        if (pkg.flatDependents.has(dep))
          continue
        pkg.flatDependents.add(dep)
        traverseDependents(result.packages.get(dep)!)
      }
    }

    traverseDependencies(pkg)
    traverseDependents(pkg)
  }

  for (const pkg of result.packages.values())
    resloveFlatDependencies(pkg)

  return result
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesResult> {
  const result = await listPackageDependenciesRaw(options) as ListPackageDependenciesResult
  await Promise.all(Array.from(result.packages.values()).map(async pkg => resolvePackage(pkg)))
  return result
}

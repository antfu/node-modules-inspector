import type { AgentName } from 'package-manager-detector'
import type { ListPackageDependenciesBaseResult, ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeBase } from '../types'

/**
 * List dependencies of packages in the current project.
 *
 * This function will automatically detect the package manager in the current project, and list the dependencies of the packages.
 */
export async function listPackageDependenciesRaw(
  manager: AgentName,
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  let result: ListPackageDependenciesRawResult
  if (manager === 'pnpm')
    result = await import('../agents/pnpm').then(r => r.listPackageDependencies(options))
  else
    throw new Error(`Package manager ${manager} is not yet supported`)

  return populateRawResult(result)
}

// TODO: maybe this should be move to frontend
function populateRawResult(input: ListPackageDependenciesRawResult): ListPackageDependenciesBaseResult {
  const result: ListPackageDependenciesBaseResult = {
    ...input,
    packages: new Map(),
  }

  // Create fields for each package
  for (const [spec, pkg] of input.packages) {
    const node = Object.assign(pkg, {
      dependents: new Set(),
      flatDependencies: new Set(),
      flatDependents: new Set(),
      depth: pkg.workspace ? 0 : Infinity,
    }) as PackageNodeBase
    result.packages.set(spec, node)
  }

  // Populate back `dependents`
  for (const pkg of result.packages.values()) {
    for (const dep of pkg.dependencies) {
      result.packages.get(dep)
        ?.dependents
        .add(pkg.spec)
    }
  }

  function resloveFlatDependencies(pkg: PackageNodeBase) {
    const postTasks: (() => void)[] = []

    function traverseDependencies(
      node: PackageNodeBase,
      seen: Set<PackageNodeBase> = new Set(),
    ) {
      for (const dep of node.dependencies) {
        const level = node.depth + 1
        const depNode = result.packages.get(dep)!

        if (!node.workspace) {
          if (node.dev)
            depNode.dev = true
          if (node.prod)
            depNode.prod = true
          if (node.optional)
            depNode.optional = true
        }
        if (depNode.depth > level)
          depNode.depth = level

        if (seen.has(depNode))
          continue

        pkg.flatDependencies.add(dep)
        seen.add(depNode)
        postTasks.push(() => {
          depNode.flatDependents.add(pkg.spec)
        })
        traverseDependencies(depNode, seen)
      }
    }

    function traverseDependents(node: PackageNodeBase) {
      for (const dep of node.dependents) {
        if (pkg.flatDependents.has(dep))
          continue
        pkg.flatDependents.add(dep)
        const parentNode = result.packages.get(dep)!
        postTasks.push(() => {
          parentNode.flatDependencies.add(pkg.spec)
        })
        traverseDependents(parentNode)
      }
    }

    traverseDependencies(pkg)
    traverseDependents(pkg)

    for (const task of postTasks)
      task()
  }

  for (const pkg of result.packages.values())
    resloveFlatDependencies(pkg)

  return result
}

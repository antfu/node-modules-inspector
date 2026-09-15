import type { ListPackageDependenciesBaseResult, ListPackageDependenciesRawResult, PackageNodeBase } from './types'

/**
 * Populate a raw dependency listing into a base result:
 * inverts edges into `dependents`, computes `depth` / `shallowestDependent`,
 * and accumulates `flatDependencies` / `flatDependents` / `flatClusters`.
 *
 * Pure in-memory transform — safe to run in any environment (no filesystem access).
 */
export function populateRawResult(input: ListPackageDependenciesRawResult): ListPackageDependenciesBaseResult {
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
      flatClusters: new Set(),
      depth: pkg.workspace ? 0 : Infinity,
    }) as PackageNodeBase
    for (const cluster of pkg.clusters) {
      node.flatClusters.add(cluster)
    }
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

  function resolveFlatDependencies(pkg: PackageNodeBase) {
    const postTasks: (() => void)[] = []

    function traverseDependencies(
      node: PackageNodeBase,
      seen: Set<PackageNodeBase> = new Set(),
    ) {
      for (const dep of node.dependencies) {
        // Peer-satisfied edges are not "pulled in" by `node` - they must
        // already be provided by whoever installs it - so they don't count
        // towards transitive dependencies, depth, or cluster propagation.
        if (node.peerDependencies?.has(dep))
          continue

        const level = node.depth + 1
        const depNode = result.packages.get(dep)
        if (!depNode)
          continue
        if (!node.workspace) {
          for (const cluster of node.flatClusters) {
            depNode.flatClusters.add(cluster)
          }
        }
        if (depNode.depth > level) {
          depNode.depth = level
          depNode.shallowestDependent?.clear()
        }
        if (depNode.depth === level) {
          depNode.shallowestDependent ||= new Set()
          depNode.shallowestDependent.add(node.spec)
        }

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
        // Mirror `traverseDependencies`'s peer skip: `pkg` is still a real
        // dependent of `parentNode` even via a peer edge, but it must not be
        // re-added to `parentNode.flatDependencies` after being excluded there.
        if (!parentNode.peerDependencies?.has(pkg.spec)) {
          postTasks.push(() => {
            parentNode.flatDependencies.add(pkg.spec)
          })
        }
        traverseDependents(parentNode)
      }
    }

    traverseDependencies(pkg)
    traverseDependents(pkg)

    for (const task of postTasks)
      task()
  }

  for (const pkg of result.packages.values())
    resolveFlatDependencies(pkg)

  return result
}

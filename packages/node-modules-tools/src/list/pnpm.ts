import type { PackageDependencyHierarchy } from '@pnpm/list'
import type { ProjectManifest } from '@pnpm/types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNode } from '../types'
import { x } from 'tinyexec'

type RawPackageNode = Pick<ProjectManifest, 'description' | 'license' | 'author' | 'homepage'> & {
  alias: string | undefined
  version: string
  path: string
  resolved?: string
  from: string
  repository?: string
  dependencies?: Record<string, RawPackageNode>
}

type DependencyHierarchy = Pick<PackageDependencyHierarchy, 'name' | 'version' | 'path'> &
  Required<Pick<PackageDependencyHierarchy, 'private'>> &
  {
    dependencies?: Record<string, RawPackageNode>
    devDependencies?: Record<string, RawPackageNode>
    optionalDependencies?: Record<string, RawPackageNode>
    unsavedDependencies?: Record<string, RawPackageNode>
  }

async function getDependenciesTree(options: ListPackageDependenciesOptions): Promise<DependencyHierarchy[]> {
  const args = ['ls', '--json', '--no-optional', '--depth', String(options.depth)]
  if (options.monorepo)
    args.push('--recursive')
  const raw = await x('pnpm', args, { throwOnError: true, nodeOptions: { cwd: options.cwd } })
  const tree = JSON.parse(raw.stdout) as DependencyHierarchy[]
  return tree
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  const tree = await getDependenciesTree(options)
  const specs = new Map<string, PackageNode>()

  const map = new WeakMap<RawPackageNode, PackageNode>()
  function normalize(raw: RawPackageNode): PackageNode {
    let node = map.get(raw)
    if (node)
      return node
    node = {
      spec: `${raw.from}@${raw.version}`,
      name: raw.from,
      version: raw.version,
      path: raw.path,
      dependencies: new Set(),
      dependents: new Set(),
      flatDependents: new Set(),
      flatDependencies: new Set(),
      nestedLevels: new Set(),
      dev: false,
      prod: false,
      optional: false,
    }
    map.set(raw, node)
    return node
  }

  function traverse(
    _node: RawPackageNode,
    level: number,
    mode: 'dev' | 'prod' | 'optional',
    directImporter: string | undefined,
    nestedImporter: string[],
  ): void {
    const node = normalize(_node)

    // Update note information
    if (directImporter)
      node.dependents.add(directImporter)
    for (const im of nestedImporter)
      node.flatDependents.add(im)
    node.nestedLevels.add(level)
    if (mode === 'dev')
      node.dev = true
    if (mode === 'prod')
      node.prod = true
    if (mode === 'optional')
      node.optional = true

    // Filter out node
    if (options.traverseFilter?.(node) === false)
      return

    if (specs.has(node.spec))
      return
    specs.set(node.spec, node)
    for (const dep of Object.values(_node.dependencies || {})) {
      traverse(dep, level + 1, mode, node.spec, [...nestedImporter, node.spec])
    }
  }

  for (const pkg of tree) {
    for (const dep of Object.values(pkg.dependencies || {})) {
      traverse(dep, 1, 'prod', undefined, [])
    }
    for (const dep of Object.values(pkg.devDependencies || {})) {
      traverse(dep, 1, 'dev', undefined, [])
    }
  }

  const packages = [...specs.values()].sort((a, b) => a.spec.localeCompare(b.spec))

  for (const pkg of packages) {
    for (const dep of pkg.flatDependents) {
      const node = specs.get(dep)
      if (node)
        node.flatDependencies.add(pkg.spec)
    }
  }

  return {
    cwd: options.cwd,
    packageManager: 'pnpm',
    packages,
  }
}

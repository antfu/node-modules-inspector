import type { PackageDependencyHierarchy } from '@pnpm/list'
import type { ProjectManifest } from '@pnpm/types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeBase } from '../types'
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
  const packages = new Map<string, PackageNodeBase>()

  const mapNormalize = new WeakMap<RawPackageNode, PackageNodeBase>()
  function normalize(raw: RawPackageNode): PackageNodeBase {
    let node = mapNormalize.get(raw)
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
    mapNormalize.set(raw, node)
    return node
  }

  function traverse(
    raw: RawPackageNode,
    level: number,
    mode: 'dev' | 'prod' | 'optional',
    directImporter: string | undefined,
  ): PackageNodeBase {
    const node = normalize(raw)

    // Update note information
    if (directImporter) {
      node.dependents.add(directImporter)
    }
    node.nestedLevels.add(level)
    if (mode === 'dev')
      node.dev = true
    if (mode === 'prod')
      node.prod = true
    if (mode === 'optional')
      node.optional = true

    // Filter out node
    if (options.traverseFilter?.(node) === false)
      return node

    if (packages.has(node.spec))
      return node

    packages.set(node.spec, node)
    for (const dep of Object.values(raw.dependencies || {})) {
      const resolvedDep = traverse(dep, level + 1, mode, node.spec)
      node.dependencies.add(resolvedDep.spec)
    }

    return node
  }

  for (const pkg of tree) {
    for (const dep of Object.values(pkg.dependencies || {})) {
      traverse(dep, 1, 'prod', undefined)
    }
    for (const dep of Object.values(pkg.devDependencies || {})) {
      traverse(dep, 1, 'dev', undefined)
    }
  }

  return {
    cwd: options.cwd,
    packageManager: 'pnpm',
    packages,
  }
}

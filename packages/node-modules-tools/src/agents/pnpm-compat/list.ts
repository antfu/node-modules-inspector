import type { PackageJson } from 'pkg-types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeRaw } from '../../types'
import fs from 'node:fs'
import { load as yamlLoad } from 'js-yaml'
import { dirname, join, relative } from 'pathe'
import { x } from 'tinyexec'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_OPTIONAL, CLUSTER_DEP_PROD } from '../../constants'
import { createVirtualStoreResolver } from './paths'

export interface PnpmCompatOptions {
  /**
   * Package manager name reported in the result
   */
  packageManager: 'aube' | 'nub'
  /**
   * CLI binary used to query the dependency graph
   */
  binary: string
  /**
   * Virtual store directory names under `node_modules` (`.aube`, `.store`, ...)
   */
  virtualStoreDirs: string[]
  /**
   * Workspace manifests that may declare `catalog` / `catalogs`
   */
  workspaceManifests: string[]
}

interface PnpmCompatPackageNode {
  version?: string
  dependencies?: Record<string, PnpmCompatPackageNode>
  devDependencies?: Record<string, PnpmCompatPackageNode>
  optionalDependencies?: Record<string, PnpmCompatPackageNode>
}

interface PnpmCompatImporter extends PnpmCompatPackageNode {
  name?: string
  path: string
}

async function getVersion(config: PnpmCompatOptions, options: ListPackageDependenciesOptions) {
  try {
    const raw = await x(config.binary, ['--version'], { throwOnError: true, nodeOptions: { cwd: options.cwd } })
    // `aube` prints `2.10.1 windows-x64 (...)`, `nub` prints `v0.9.6` followed by
    // a node version banner - only the leading token matters.
    const version = raw.stdout.trim().split(/\s+/)[0]?.replace(/^v/, '')
    return version || undefined
  }
  catch (err) {
    console.error(`Failed to get ${config.packageManager} version`)
    console.error(err)
    return undefined
  }
}

async function resolveRoot(config: PnpmCompatOptions, options: ListPackageDependenciesOptions) {
  try {
    const raw = await x(config.binary, ['root'], { throwOnError: true, nodeOptions: { cwd: options.cwd } })
    const stdout = raw.stdout.trim()
    // Both aube and nub print the `node_modules` directory, matching
    // `pnpm root` - so the project root is its parent.
    return stdout ? dirname(stdout) : options.cwd
  }
  catch (err) {
    console.error('Failed to resolve root directory')
    console.error(err)
    return options.cwd
  }
}

async function runJson<T>(
  config: PnpmCompatOptions,
  args: string[],
  options: ListPackageDependenciesOptions,
): Promise<T> {
  const { stdout } = await x(config.binary, args, {
    throwOnError: true,
    nodeOptions: { cwd: options.cwd, stdio: 'pipe' },
  })
  try {
    return JSON.parse(stdout) as T
  }
  catch (err) {
    throw new Error(`Failed to parse \`${config.binary} ${args.join(' ')}\` output: ${(err as Error).message}`)
  }
}

async function getImporters(
  config: PnpmCompatOptions,
  options: ListPackageDependenciesOptions,
): Promise<PnpmCompatImporter[]> {
  const baseArgs = ['ls', '--json', '--depth', String(options.depth)]
  const importers = await runJson<PnpmCompatImporter[]>(config, baseArgs, options)

  if (!Array.isArray(importers))
    throw new Error(`Failed to parse \`${config.binary} ls\` output, expected an array but got: ${typeof importers}`)

  if (!options.monorepo)
    return importers

  // `-r` lists workspace packages without the root importer, so both runs are
  // merged. Not every version supports `--include-workspace-root`, and running
  // the plain command keeps the root project represented either way.
  const workspaceImporters = await runJson<PnpmCompatImporter[]>(config, [...baseArgs, '-r'], options)
  const seen = new Set(importers.map(i => i.path))
  return [
    ...importers,
    ...(Array.isArray(workspaceImporters)
      ? workspaceImporters.filter(i => !seen.has(i.path))
      : []),
  ]
}

async function getCatalogs(root: string, manifests: string[]): Promise<Record<string, Record<string, string> | undefined>> {
  for (const manifest of manifests) {
    const filepath = join(root, manifest)
    if (fs.existsSync(filepath)) {
      const raw = await fs.promises.readFile(filepath, 'utf-8')
      const data = yamlLoad(raw) as any || {}
      return {
        ...data.catalogs || {},
        default: data.catalog,
      }
    }
  }
  return {}
}

async function readManifest(path: string): Promise<PackageJson | undefined> {
  try {
    const content = await fs.promises.readFile(join(path, 'package.json'), 'utf-8')
    return JSON.parse(content) as PackageJson
  }
  catch {
    return undefined
  }
}

export function createListPackageDependencies(config: PnpmCompatOptions) {
  return async function listPackageDependencies(
    options: ListPackageDependenciesOptions,
  ): Promise<ListPackageDependenciesRawResult> {
    const root = await resolveRoot(config, options)
    const importers = await getImporters(config, options)
    const catalogsMap = await getCatalogs(root, config.workspaceManifests)
    const resolveFilepath = createVirtualStoreResolver(root, config.virtualStoreDirs)
    const packages = new Map<string, PackageNodeRaw>()

    const workspacePackages = await Promise.all(importers.map(async (pkg, index) => {
      const manifest = await readManifest(pkg.path)
      let name = pkg.name
      if (!name) {
        let path = relative(root, pkg.path)
        if (path === '.')
          path = ''
        const suffix = path.toLowerCase().replace(/[^a-z0-9-]+/g, '_').slice(0, 20)
        name = suffix ? `#workspace-${suffix}` : (index === 0 ? '#workspace-root' : `#workspace-${index + 1}`)
      }
      const version = pkg.version || manifest?.version || '0.0.0'
      const node: PackageNodeRaw = {
        spec: `${name}@${version}`,
        name,
        version,
        filepath: pkg.path,
        dependencies: new Set(),
        workspace: true,
        clusters: new Set(),
      }
      if (manifest?.private)
        node.private = true
      packages.set(node.spec, node)
      return {
        importer: pkg,
        node,
      }
    }))

    const visited = new Set<string>()

    function traverse(
      raw: PnpmCompatPackageNode,
      aliasName: string,
      level: number,
      clusters: Iterable<string>,
    ): PackageNodeRaw {
      const version = raw.version || '0.0.0'
      const spec = `${aliasName}@${version}`

      let node = packages.get(spec)
      if (!node) {
        node = {
          spec,
          name: aliasName,
          version,
          filepath: resolveFilepath(aliasName, version) || join(root, 'node_modules', aliasName),
          dependencies: new Set(),
          workspace: false,
          clusters: new Set(),
        }
        packages.set(spec, node)
      }

      for (const cluster of clusters)
        node.clusters.add(cluster)

      if (!node.workspace && level === 1) {
        const catalogs = Object.entries(catalogsMap)
          .filter(([_, catalog]) => catalog?.[node!.name])
          .map(([name]) => name)
        for (const catalog of catalogs)
          node.clusters.add(`catalog:${catalog}`)
      }

      // Filter out node
      if (options.traverseFilter?.(node) === false)
        return node

      if (visited.has(spec))
        return node
      visited.add(spec)

      if (options.dependenciesFilter?.(node) !== false) {
        for (const [depName, dep] of Object.entries(raw.dependencies || {})) {
          const resolvedDep = traverse(dep, depName, level + 1, clusters)
          node.dependencies.add(resolvedDep.spec)
        }
        for (const [depName, dep] of Object.entries(raw.optionalDependencies || {})) {
          const clustersWithOptional = new Set(clusters)
          clustersWithOptional.add(CLUSTER_DEP_OPTIONAL)
          const resolvedDep = traverse(dep, depName, level + 1, clustersWithOptional)
          node.dependencies.add(resolvedDep.spec)
        }
      }

      return node
    }

    for (const { importer, node } of workspacePackages) {
      for (const [depName, dep] of Object.entries(importer.dependencies || {}))
        node.dependencies.add(traverse(dep, depName, 1, [CLUSTER_DEP_PROD]).spec)
      for (const [depName, dep] of Object.entries(importer.devDependencies || {}))
        node.dependencies.add(traverse(dep, depName, 1, [CLUSTER_DEP_DEV]).spec)
      for (const [depName, dep] of Object.entries(importer.optionalDependencies || {}))
        node.dependencies.add(traverse(dep, depName, 1, [CLUSTER_DEP_OPTIONAL]).spec)
    }

    return {
      root,
      packageManager: config.packageManager,
      packageManagerVersion: await getVersion(config, options),
      packages,
      catalogs: catalogsMap as Record<string, Record<string, string>>,
    }
  }
}

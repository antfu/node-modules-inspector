import type { PackageDependencyHierarchy } from '@pnpm/list'
import type { ProjectManifest } from '@pnpm/types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeRaw } from '../../types'
import fs from 'node:fs'
import YAML from 'js-yaml'
import { dirname, join, relative } from 'pathe'
import { x } from 'tinyexec'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_PROD } from '../../constants'
import { JsonParseStreamError } from '../../json-parse-stream'

type PnpmPackageNode = Pick<ProjectManifest, 'description' | 'license' | 'author' | 'homepage'> & {
  alias: string | undefined
  version: string
  path: string
  resolved?: string
  from: string
  repository?: string
  dependencies?: Record<string, PnpmPackageNode>
}

type PnpmDependencyHierarchy = Pick<PackageDependencyHierarchy, 'name' | 'version' | 'path'>
  & Required<Pick<PackageDependencyHierarchy, 'private'>>
  & {
    dependencies?: Record<string, PnpmPackageNode>
    devDependencies?: Record<string, PnpmPackageNode>
    optionalDependencies?: Record<string, PnpmPackageNode>
    unsavedDependencies?: Record<string, PnpmPackageNode>
  }

async function resolveRoot(options: ListPackageDependenciesOptions) {
  let raw: string | undefined
  if (options.workspace === false) {
    try {
      raw = (await x('pnpm', ['root'], { throwOnError: true, nodeOptions: { cwd: options.cwd } }))
        .stdout
        .trim()
    }
    catch (err) {
      console.error('Failed to resolve root directory')
      console.error(err)
    }
  }
  else {
    try {
      raw = (await x('pnpm', ['root', '-w'], { throwOnError: true, nodeOptions: { cwd: options.cwd } }))
        .stdout
        .trim()
    }
    catch {
      try {
        raw = (await x('pnpm', ['root'], { throwOnError: true, nodeOptions: { cwd: options.cwd } }))
          .stdout
          .trim()
      }
      catch (err) {
        console.error('Failed to resolve root directory')
        console.error(err)
      }
    }
  }
  return raw ? dirname(raw) : options.cwd
}

async function getPnpmVersion(options: ListPackageDependenciesOptions) {
  try {
    const raw = await x('pnpm', ['--version'], { throwOnError: true, nodeOptions: { cwd: options.cwd } })
    return raw.stdout.trim()
  }
  catch (err) {
    console.error('Failed to get pnpm version')
    console.error(err)
    return undefined
  }
}

async function getDependenciesTree(options: ListPackageDependenciesOptions): Promise<PnpmDependencyHierarchy[]> {
  const args = ['ls', '--json', '--depth', String(options.depth)]
  if (options.monorepo)
    args.push('--recursive')
  if (options.workspace === false)
    args.push('--ignore-workspace')
  const process = x('pnpm', args, {
    throwOnError: true,
    nodeOptions: {
      stdio: 'pipe',
      cwd: options.cwd,
    },
  })

  const json = await import('../../json-parse-stream')
    .then(r => r.parseJsonStreamWithConcatArrays<PnpmDependencyHierarchy>(process.process!.stdout!, 'pnpm ls'))
    .catch((err) => {
      if (err instanceof JsonParseStreamError) {
        try {
          if (err.data.error?.message === 'Invalid string length') {
            console.error(`pnpm ls output is too large to parse, please try using the --depth=${String(Math.ceil(options.depth / 3 * 2))} option to limit the depth of the dependency tree`)
          }
        }
        catch {}
      }
      throw err
    })

  if (!Array.isArray(json))
    throw new Error(`Failed to parse \`pnpm ls\` output, expected an array but got: ${String(json)}`)

  return json
}

export async function getCatalogs(root: string): Promise<Record<string, Record<string, string>>> {
  if (!fs.existsSync(join(root, 'pnpm-workspace.yaml')))
    return {}
  const raw = await fs.promises.readFile(join(root, 'pnpm-workspace.yaml'), 'utf-8')
  const data = YAML.load(raw) as any || {}
  return {
    ...data.catalogs || {},
    default: data.catalog,
  }
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  const root = await resolveRoot(options) || options.cwd
  const tree = await getDependenciesTree(options)
  const catalogsMap = await getCatalogs(root)
  const packages = new Map<string, PackageNodeRaw>()

  const workspacePackages = tree.map((pkg) => {
    let name = pkg.name
    if (!name) {
      let path = relative(root, pkg.path)
      if (path === '.')
        path = ''
      const suffix = path.toLowerCase().replace(/[^a-z0-9-]+/g, '_').slice(0, 20)
      name = suffix ? `#workspace-${suffix}` : '#workspace-root'
    }
    const version = pkg.version || '0.0.0'
    const node: PackageNodeRaw = {
      spec: `${name}@${version}`,
      name,
      version,
      filepath: pkg.path,
      dependencies: new Set(),
      workspace: true,
      clusters: new Set(),
    }
    if (pkg.private)
      node.private = true
    packages.set(node.spec, node)
    return {
      pkg,
      node,
    }
  })

  const mapNormalize = new WeakMap<PnpmPackageNode, PackageNodeRaw>()
  function normalize(raw: PnpmPackageNode): PackageNodeRaw {
    let node = mapNormalize.get(raw)
    if (node)
      return node

    // Resolve workspace package version
    let version = raw.version
    if (version.includes(':')) {
      const workspaceMapping = workspacePackages.find(i => i.pkg.path === raw.path)
      if (workspaceMapping)
        version = workspaceMapping.node.version
    }

    const spec = `${raw.from}@${version}`

    node = packages.get(spec) || {
      spec,
      name: raw.from,
      version,
      filepath: raw.path,
      dependencies: new Set(),
      clusters: new Set(),
    }
    mapNormalize.set(raw, node)
    return node
  }

  function traverse(
    raw: PnpmPackageNode,
    level: number,
    clusters: Iterable<string>,
  ): PackageNodeRaw {
    const node = normalize(raw)

    if (!node.workspace) {
      for (const cluster of clusters) {
        node.clusters.add(cluster)
      }
    }

    if (!node.workspace && level === 1) {
      const catalogs = Object.entries(catalogsMap)
        .filter(([_, catalog]) => catalog?.[node.name])
        .map(([name]) => name)
      for (const catalog of catalogs) {
        node.clusters.add(`catalog:${catalog}`)
      }
    }

    // Filter out node
    if (options.traverseFilter?.(node) === false)
      return node

    if (packages.has(node.spec))
      return node

    packages.set(node.spec, node)

    if (options.dependenciesFilter?.(node) !== false) {
      for (const dep of Object.values(raw.dependencies || {})) {
        const resolvedDep = traverse(dep, level + 1, clusters)
        node.dependencies.add(resolvedDep.spec)
      }
    }

    return node
  }

  // Traverse deps
  for (const { pkg, node } of workspacePackages) {
    for (const dep of Object.values(pkg.dependencies || {})) {
      const result = traverse(dep, 1, [CLUSTER_DEP_PROD])
      node.dependencies.add(result.spec)
    }
    for (const dep of Object.values(pkg.devDependencies || {})) {
      const result = traverse(dep, 1, [CLUSTER_DEP_DEV])
      node.dependencies.add(result.spec)
    }
  }

  return {
    root,
    packageManager: 'pnpm',
    packageManagerVersion: await getPnpmVersion(options),
    packages,
  }
}

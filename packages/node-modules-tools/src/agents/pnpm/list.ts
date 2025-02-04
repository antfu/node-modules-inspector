import type { PackageDependencyHierarchy } from '@pnpm/list'
import type { ProjectManifest } from '@pnpm/types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeRaw } from '../../types'
import { dirname, relative } from 'pathe'
import { x } from 'tinyexec'

type PnpmPackageNode = Pick<ProjectManifest, 'description' | 'license' | 'author' | 'homepage'> & {
  alias: string | undefined
  version: string
  path: string
  resolved?: string
  from: string
  repository?: string
  dependencies?: Record<string, PnpmPackageNode>
}

type PnpmDependencyHierarchy = Pick<PackageDependencyHierarchy, 'name' | 'version' | 'path'> &
  Required<Pick<PackageDependencyHierarchy, 'private'>> &
  {
    dependencies?: Record<string, PnpmPackageNode>
    devDependencies?: Record<string, PnpmPackageNode>
    optionalDependencies?: Record<string, PnpmPackageNode>
    unsavedDependencies?: Record<string, PnpmPackageNode>
  }

async function resolveRoot(options: ListPackageDependenciesOptions) {
  let raw: string | undefined
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
  const args = ['ls', '--json', '--no-optional', '--depth', String(options.depth)]
  if (options.monorepo)
    args.push('--recursive')
  const process = x('pnpm', args, {
    throwOnError: true,
    nodeOptions: {
      stdio: 'pipe',
      cwd: options.cwd,
    },
  })

  const json = await import('../../json-parse-stream')
    .then(r => r.parseJsonStream<PnpmDependencyHierarchy[]>(process.process!.stdout!))

  if (!Array.isArray(json))
    throw new Error(`Failed to parse \`pnpm ls\` output, expected an array but got: ${String(json)}`)

  return json
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  const root = await resolveRoot(options) || options.cwd
  const tree = await getDependenciesTree(options)
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
    }
    mapNormalize.set(raw, node)
    return node
  }

  function traverse(
    raw: PnpmPackageNode,
    level: number,
    mode: 'dev' | 'prod' | 'optional',
  ): PackageNodeRaw {
    const node = normalize(raw)

    if (!node.workspace) {
      if (mode === 'dev')
        node.dev = true
      if (mode === 'prod')
        node.prod = true
      if (mode === 'optional')
        node.optional = true
    }

    // Filter out node
    if (options.traverseFilter?.(node) === false)
      return node

    if (packages.has(node.spec))
      return node

    packages.set(node.spec, node)
    for (const dep of Object.values(raw.dependencies || {})) {
      const resolvedDep = traverse(dep, level + 1, mode)
      node.dependencies.add(resolvedDep.spec)
    }

    return node
  }

  // Traverse deps
  for (const { pkg, node } of workspacePackages) {
    for (const dep of Object.values(pkg.dependencies || {})) {
      const result = traverse(dep, 1, 'prod')
      node.dependencies.add(result.spec)
    }
    for (const dep of Object.values(pkg.devDependencies || {})) {
      const result = traverse(dep, 1, 'dev')
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

import type { BaseManifest } from '@pnpm/types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeRaw } from '../../types'
import { dirname, relative } from 'pathe'
import { x } from 'tinyexec'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_OPTIONAL, CLUSTER_DEP_PROD } from '../../constants'

type NpmPackageNode = BaseManifest & {
  name: string
  version: string
  private?: false
  _id: string
  pkgid: string
  location: string
  path: string
  realpath: string
  resolved: string
  from: string[]
  to: string[]
  dev: boolean
  inBundle: boolean
  deduped: boolean
  overridden: boolean
  queryContext: Record<any, any>
}

async function resolveRoot(options: ListPackageDependenciesOptions) {
  let raw: string | undefined
  try {
    raw = (await x('npm', ['root'], { throwOnError: true, nodeOptions: { cwd: options.cwd } })).stdout.trim()
  }
  catch (err) {
    console.error('Failed to resolve root directory')
    console.error(err)
  }
  return raw ? dirname(raw) : options.cwd
}

async function getNpmVersion(options: ListPackageDependenciesOptions) {
  try {
    const raw = await x('npm', ['--version'], { throwOnError: true, nodeOptions: { cwd: options.cwd } })
    return raw.stdout.trim()
  }
  catch (err) {
    console.error('Failed to get npm version')
    console.error(err)
    return undefined
  }
}

async function queryDependencies(options: ListPackageDependenciesOptions, query: string, lockfileOnly = false): Promise<NpmPackageNode[]> {
  // https://docs.npmjs.com/cli/v9/commands/npm-query
  const args = ['query']
  if (lockfileOnly)
    args.push('--package-lock-only')
  args.push(query)
  const process = x('npm', args, {
    throwOnError: true,
    nodeOptions: {
      stdio: 'pipe',
      cwd: options.cwd,
    },
  })

  const json = await import('../../json-parse-stream')
    .then(r => r.parseJsonStreamWithConcatArrays<NpmPackageNode>(process.process!.stdout!))

  if (!Array.isArray(json))
    throw new Error(`Failed to parse \`npm query\` output, expected an array but got: ${String(json)}`)

  return json
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  // Run concurrently since npm cli has a lot of overhead
  // Source: https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-4/
  const [
    rootPackage,
    workspaces,
    devDependencies,
    prodDependencies,
    optionalDependencies,
    packageManagerVersion,
    root,
  ] = await Promise.all([
    queryDependencies(options, ':root', true).then(res => res[0]),
    queryDependencies(options, '.workspace', true),
    queryDependencies(options, '.dev'),
    queryDependencies(options, '.prod'),
    queryDependencies(options, '.optional'),
    getNpmVersion(options),
    resolveRoot(options),
  ])

  if (!rootPackage)
    throw new Error('Could not find root package.json')

  const packages = new Map<string, PackageNodeRaw>()
  // Used to link package deps with resolved version
  const packageSpecByLocation = new Map<string, string>()

  packageSpecByLocation.set(rootPackage.location, rootPackage._id)
  packages.set(rootPackage._id, {
    name: rootPackage.name,
    version: rootPackage.version,
    spec: rootPackage._id,
    private: rootPackage.private,
    filepath: rootPackage.path,
    workspace: true,
    dependencies: new Set(),
    clusters: new Set(),
  })

  workspaces.forEach((pkg, i) => {
    let name = pkg.name
    if (!name) {
      let path = relative(root, pkg.path)
      if (path === '.')
        path = ''
      const suffix = path.toLowerCase().replace(/[^a-z0-9-]+/g, '_').slice(0, 20)
      name = suffix ? `#workspace-${suffix}` : `#workspace-package-${i + 1}`
    }
    const version = pkg.version || '0.0.0'
    const node: PackageNodeRaw = {
      spec: pkg._id,
      name,
      version,
      filepath: pkg.path,
      dependencies: new Set(),
      private: pkg.private,
      workspace: true,
      clusters: new Set(),
    }
    packageSpecByLocation.set(pkg.location, node.spec)
    packages.set(node.spec, node)
  })

  function normalize(
    raw: NpmPackageNode,
    clusters: Iterable<string>,
  ) {
    if (packages.has(raw._id))
      return

    packageSpecByLocation.set(raw.location, raw._id)
    packages.set(raw._id, {
      name: raw.name,
      version: raw.version,
      spec: raw._id,
      private: raw.private,
      filepath: raw.path,
      workspace: false,
      dependencies: new Set(),
      clusters: new Set(clusters),
    })
  }

  prodDependencies.forEach((raw) => {
    normalize(raw, [CLUSTER_DEP_PROD])
  })
  devDependencies.forEach((raw) => {
    normalize(raw, [CLUSTER_DEP_DEV])
  })
  optionalDependencies.forEach((raw) => {
    normalize(raw, [CLUSTER_DEP_OPTIONAL])
  })

  // Add all dep links
  Array.of(
    ...devDependencies,
    ...prodDependencies,
    ...optionalDependencies,
    ...workspaces,
    rootPackage,
  ).forEach((raw) => {
    const pkg = packages.get(raw._id)
    if (!pkg)
      return

    raw.to.forEach((to) => {
      const resolved = packageSpecByLocation.get(to)
      if (!resolved)
        return
      pkg.dependencies.add(resolved)
    })
  })

  return {
    root,
    packageManager: 'npm',
    packageManagerVersion,
    packages,
  }
}

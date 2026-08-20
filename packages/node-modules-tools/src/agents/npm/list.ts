import type { BaseManifest } from '@pnpm/types'
import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeRaw } from '../../types'
import { dirname, relative } from 'pathe'
import { x } from 'tinyexec'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_OPTIONAL, CLUSTER_DEP_PROD } from '../../constants'

type NpmPackageNode = BaseManifest & {
  name?: string
  version?: string
  private?: false
  _id?: string
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

/**
 * `npm query` omits `name`/`version`/`_id` entirely for packages whose
 * `package.json` doesn't declare them (most commonly the root `package.json`
 * in a monorepo that doesn't version itself independently). Synthesize sane
 * fallbacks so those packages are still represented instead of being dropped.
 */
function resolveIdentity(pkg: NpmPackageNode, root: string, fallbackName: string) {
  let name = pkg.name
  if (!name) {
    let path = relative(root, pkg.path)
    if (path === '.')
      path = ''
    const suffix = path.toLowerCase().replace(/[^a-z0-9-]+/g, '_').slice(0, 20)
    name = suffix ? `#workspace-${suffix}` : fallbackName
  }
  const version = pkg.version || '0.0.0'
  const id = pkg._id || pkg.pkgid || `${name}@${version}`
  return { name, version, id }
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
    .then(r => r.parseJsonStreamWithConcatArrays<NpmPackageNode>(process.process!.stdout!, 'npm query'))

  if (!Array.isArray(json))
    throw new Error(`Failed to parse \`npm query\` output, expected an array but got: ${String(json)}`)

  return json.filter((pkg): pkg is NpmPackageNode => {
    if (!pkg || typeof pkg !== 'object' || typeof pkg.pkgid !== 'string' || typeof pkg.location !== 'string' || typeof pkg.path !== 'string')
      return false

    // `--package-lock-only` reads straight from the lockfile/project structure
    // (used for `:root` and `.workspace`), so `name`/`version` can legitimately
    // be missing there (e.g. an unversioned monorepo root) — keep those entries
    // and synthesize fallbacks for them later.
    // Regular queries scan the installed `node_modules` tree instead, where a
    // missing `name`/`version` means npm left behind a broken/leftover
    // directory rather than a real package — keep filtering those out.
    if (!lockfileOnly && (typeof pkg.name !== 'string' || typeof pkg.version !== 'string'))
      return false

    return true
  })
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

  const rootIdentity = resolveIdentity(rootPackage, root, '#workspace-root')
  packageSpecByLocation.set(rootPackage.location, rootIdentity.id)
  packages.set(rootIdentity.id, {
    name: rootIdentity.name,
    version: rootIdentity.version,
    spec: rootIdentity.id,
    private: rootPackage.private,
    filepath: rootPackage.path,
    workspace: true,
    dependencies: new Set(),
    clusters: new Set(),
  })

  workspaces.forEach((pkg, i) => {
    const { name, version, id } = resolveIdentity(pkg, root, `#workspace-package-${i + 1}`)
    const node: PackageNodeRaw = {
      spec: id,
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
    if (packageSpecByLocation.has(raw.location))
      return

    const { name, version, id } = resolveIdentity(raw, root, `#dependency-${raw.location.toLowerCase().replace(/[^a-z0-9-]+/g, '_').slice(0, 20)}`)
    packageSpecByLocation.set(raw.location, id)
    if (packages.has(id))
      return
    packages.set(id, {
      name,
      version,
      spec: id,
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
    const spec = packageSpecByLocation.get(raw.location)
    const pkg = spec ? packages.get(spec) : undefined
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

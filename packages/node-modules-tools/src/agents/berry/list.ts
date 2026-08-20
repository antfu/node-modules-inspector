import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeRaw } from '../../types'
import fs from 'node:fs'
import { load as yamlLoad } from 'js-yaml'
import { dirname, join, relative, resolve } from 'pathe'
import { x } from 'tinyexec'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_OPTIONAL, CLUSTER_DEP_PROD } from '../../constants'

type PackageVersion = string

type BerryLocator = `${string}@${string}`

interface BerryPackageNode {
  value: BerryLocator
  children: {
    Version: PackageVersion
    Dependencies?: {
      descriptor: BerryLocator
      locator: BerryLocator
    }[]
  }
}

interface YarnInstallStateEntry {
  locations?: string[]
}

interface PackageManifest {
  name?: string
  version?: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

function getLocatorParts(locator: string) {
  const separator = locator.startsWith('@')
    ? locator.indexOf('@', locator.indexOf('/') + 1)
    : locator.indexOf('@')

  if (separator < 0)
    return { name: locator, reference: '' }

  return {
    name: locator.slice(0, separator),
    reference: locator.slice(separator + 1),
  }
}

function normalizeLocator(locator: string) {
  const { name, reference: originalReference } = getLocatorParts(locator)
  let reference = originalReference

  if (reference.startsWith('virtual:')) {
    const hash = reference.indexOf('#')
    if (hash >= 0)
      reference = reference.slice(hash + 1)
  }

  if (reference.startsWith('npm:'))
    reference = reference.slice(4)

  return `${name}@${reference}`
}

function isWorkspaceLocator(locator: string) {
  return getLocatorParts(locator).reference.startsWith('workspace:')
}

async function getNodeLinker(options: ListPackageDependenciesOptions) {
  const raw = await x('yarn', ['config', 'get', 'nodeLinker'], {
    throwOnError: true,
    nodeOptions: { cwd: options.cwd },
  })
  return raw.stdout.trim()
}

function resolveRoot(cwd: string) {
  let current = resolve(cwd)

  while (true) {
    if (fs.existsSync(join(current, 'node_modules', '.yarn-state.yml')))
      return current

    const parent = dirname(current)
    if (parent === current)
      break
    current = parent
  }

  throw new Error('Could not find Yarn\'s node_modules installation state. Run `yarn install` and try again.')
}

async function getBerryVersion(options: ListPackageDependenciesOptions) {
  try {
    const raw = await x('yarn', ['--version'], { throwOnError: true, nodeOptions: { cwd: options.cwd } })
    return raw.stdout.trim()
  }
  catch (err) {
    console.error('Failed to get yarn version')
    console.error(err)
    return undefined
  }
}

async function getDependenciesList(options: ListPackageDependenciesOptions): Promise<BerryPackageNode[]> {
  const args = ['info']
  if (options.monorepo)
    args.push('--all')
  args.push('--recursive', '--json')

  const raw = await x('yarn', args, { throwOnError: true, nodeOptions: { cwd: options.cwd } })
  const json = raw.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))

  if (!Array.isArray(json))
    throw new Error(`Failed to parse \`yarn info\` output, expected an array but got: ${String(json)}`)

  return json
}

async function readInstallLocations(root: string) {
  const statePath = join(root, 'node_modules', '.yarn-state.yml')
  const raw = await fs.promises.readFile(statePath, 'utf8')
  const state = yamlLoad(raw) as Record<string, YarnInstallStateEntry> | null

  if (!state || typeof state !== 'object')
    throw new Error(`Failed to parse Yarn installation state at ${statePath}`)

  const locations = new Map<string, string>()
  for (const [locator, entry] of Object.entries(state)) {
    if (locator === '__metadata' || !Array.isArray(entry?.locations))
      continue

    const filepath = entry.locations
      .map(location => join(root, location))
      .sort((a, b) => a.length - b.length)[0]
    if (!filepath)
      continue

    const normalized = normalizeLocator(locator)
    const current = locations.get(normalized)
    if (!current || filepath.length < current.length)
      locations.set(normalized, filepath)
  }

  return locations
}

async function readPackageManifest(filepath: string | undefined): Promise<PackageManifest | undefined> {
  if (!filepath)
    return undefined

  try {
    const raw = await fs.promises.readFile(join(filepath, 'package.json'), 'utf8')
    return JSON.parse(raw) as PackageManifest
  }
  catch {
    return undefined
  }
}

function getDependencyClusters(
  workspace: boolean,
  manifest: PackageManifest | undefined,
  dependencyName: string,
  inherited: Iterable<string>,
) {
  if (workspace) {
    if (manifest?.optionalDependencies?.[dependencyName])
      return new Set([CLUSTER_DEP_OPTIONAL])
    if (manifest?.devDependencies?.[dependencyName])
      return new Set([CLUSTER_DEP_DEV])
    return new Set([CLUSTER_DEP_PROD])
  }

  const clusters = new Set(inherited)
  if (manifest?.optionalDependencies?.[dependencyName])
    clusters.add(CLUSTER_DEP_OPTIONAL)
  return clusters
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  const nodeLinker = await getNodeLinker(options)
  if (nodeLinker !== 'node-modules') {
    throw new Error(
      `Yarn Berry's ${nodeLinker} linker is not supported. Node Modules Inspector requires a physical node_modules tree; set \`nodeLinker: node-modules\` in .yarnrc.yml and run \`yarn install\`.`,
    )
  }

  const root = resolveRoot(options.cwd)
  const [list, packageManagerVersion, installLocations] = await Promise.all([
    getDependenciesList(options),
    getBerryVersion(options),
    readInstallLocations(root),
  ])

  const itemsByLocator = new Map<string, BerryPackageNode>()
  for (const item of list)
    itemsByLocator.set(normalizeLocator(item.value), item)

  const manifestsByFilepath = new Map<string, PackageManifest | undefined>()
  await Promise.all(Array.from(new Set(installLocations.values())).map(async (filepath) => {
    manifestsByFilepath.set(filepath, await readPackageManifest(filepath))
  }))

  const packages = new Map<string, PackageNodeRaw>()
  const normalizedItems = new WeakMap<BerryPackageNode, PackageNodeRaw>()

  function normalize(raw: BerryPackageNode): PackageNodeRaw {
    const existing = normalizedItems.get(raw)
    if (existing)
      return existing

    const locator = normalizeLocator(raw.value)
    const filepath = installLocations.get(locator)
    const manifest = filepath ? manifestsByFilepath.get(filepath) : undefined
    const workspace = isWorkspaceLocator(raw.value)

    let name = getLocatorParts(raw.value).name
    if (workspace) {
      if (manifest?.name) {
        name = manifest.name
      }
      else if (filepath) {
        let path = relative(root, filepath)
        if (path === '.')
          path = ''
        const suffix = path.toLowerCase().replace(/[^a-z0-9-]+/g, '_').slice(0, 20)
        name = suffix ? `#workspace-${suffix}` : '#workspace-root'
      }
    }

    const version = manifest?.version || raw.children.Version || '0.0.0'
    const spec = `${name}@${version}`
    const node: PackageNodeRaw = packages.get(spec) || {
      spec,
      name,
      version,
      filepath,
      dependencies: new Set(),
      clusters: new Set(),
      workspace,
    }
    if (manifest?.private)
      node.private = true

    normalizedItems.set(raw, node)
    return node
  }

  const traversed = new Set<string>()
  function traverse(
    raw: BerryPackageNode,
    level: number,
    inheritedClusters: Iterable<string>,
  ): PackageNodeRaw {
    const node = normalize(raw)
    if (!node.workspace) {
      for (const cluster of inheritedClusters)
        node.clusters.add(cluster)
    }

    if (options.traverseFilter?.(node) === false)
      return node

    packages.set(node.spec, node)

    if (level >= options.depth || options.dependenciesFilter?.(node) === false)
      return node

    const traversalKey = `${normalizeLocator(raw.value)}:${level}:${Array.from(inheritedClusters).sort().join(',')}`
    if (traversed.has(traversalKey))
      return node
    traversed.add(traversalKey)

    const manifest = node.filepath ? manifestsByFilepath.get(node.filepath) : undefined
    for (const dependency of raw.children.Dependencies || []) {
      const locator = normalizeLocator(dependency.locator)
      const child = itemsByLocator.get(locator)
      if (!child)
        throw new Error(`Failed to find dependency ${locator} of ${node.spec}`)

      const dependencyName = getLocatorParts(dependency.descriptor).name
      const clusters = getDependencyClusters(!!node.workspace, manifest, dependencyName, inheritedClusters)
      const childNode = traverse(child, level + 1, clusters)
      node.dependencies.add(childNode.spec)
    }

    return node
  }

  const workspaces = list.filter(item => isWorkspaceLocator(item.value))
  if (!workspaces.length)
    throw new Error('Failed to find a Yarn workspace in `yarn info` output')

  for (const workspace of workspaces)
    traverse(workspace, -1, [])

  return {
    root,
    packageManager: 'yarn',
    packageManagerVersion,
    packages,
  }
}

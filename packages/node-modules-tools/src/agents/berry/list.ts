import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult, PackageNodeRaw } from '../../types'
import { x } from 'tinyexec'

type PackageName = string

type PackageVersion = string

type BerryLocator = `${PackageName}@${string}`

type BerryDescriptor = `${PackageName}@${string}`

interface BerryPackageNode {
  value: BerryLocator
  children: {
    Version: PackageVersion
    Dependencies?: {
      descriptor: BerryDescriptor
      locator: BerryLocator
    }[]
  }
}

async function resolveRoot(options: ListPackageDependenciesOptions) {
  // TODO: A replacement for `pnpm root` command
  return options.cwd
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
  // TODO: options.depth support
  // TODO: options.monorepo support
  const args = ['info', '--all', '--recursive', '--json']

  // Interestingly, this is a list of newline-separated JSON objects…
  const raw = await x('yarn', args, { throwOnError: true, nodeOptions: { cwd: options.cwd } })

  // …so we need to parse it into an array.
  const parseable = `[${
    raw.stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .join(',')
  }]`

  const json = JSON.parse(parseable)

  if (!Array.isArray(json))
    throw new Error(`Failed to parse \`yarn info\` output, expected an array but got: ${String(json)}`)

  return json
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  const root = await resolveRoot(options) || options.cwd
  const list = await getDependenciesList(options)
  const mapList = new Map<string, BerryPackageNode>()
  for (const item of list) {
    mapList.set(cleanupSpec(item.value), item)
  }
  const packages = new Map<string, PackageNodeRaw>()

  function cleanupSpec(spec: string) {
    return spec.replace(/(\w)@.*npm:/, '$1@')
  }

  const mapNormalize = new WeakMap<BerryPackageNode, PackageNodeRaw>()
  function normalize(raw: BerryPackageNode): PackageNodeRaw {
    let node = mapNormalize.get(raw)
    if (node)
      return node

    // Resolve workspace package version
    const version = raw.children.Version

    let name: string
    if (raw.value.startsWith('@'))
      name = `@${raw.value.slice(1).split('@')[0]}`
    else
      name = raw.value.split('@')[0]

    const spec = `${name}@${version}`

    node = packages.get(spec) || {
      spec,
      name,
      version,
      // filepath: 'TODO',
      dependencies: new Set(),
    }
    mapNormalize.set(raw, node)
    return node
  }

  function traverse(raw: BerryPackageNode): PackageNodeRaw {
    const node = normalize(raw)

    // Filter out node
    if (options.traverseFilter?.(node) === false)
      return node

    if (packages.has(node.spec))
      return node

    packages.set(node.spec, node)

    if (options.dependenciesFilter?.(node) !== false) {
      for (const dep of raw.children.Dependencies || []) {
        const locator = cleanupSpec(dep.locator)
        const actualDep = mapList.get(locator)
        if (!actualDep)
          throw new Error(`Failed to find dependency ${locator} of ${node.spec}`)
        const result = normalize(actualDep)
        node.dependencies.add(result.spec)
      }
    }

    return node
  }

  for (const item of list) {
    traverse(item)
  }

  return {
    root,
    packageManager: 'berry',
    packageManagerVersion: await getBerryVersion(options),
    packages,
  }
}

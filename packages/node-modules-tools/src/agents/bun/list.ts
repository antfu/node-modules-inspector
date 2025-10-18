import type {
  ListPackageDependenciesOptions,
  ListPackageDependenciesRawResult,
  PackageNodeRaw,
} from '../../types'
import fs from 'node:fs'
import { join, relative } from 'pathe'
import { x } from 'tinyexec'
import {
  CLUSTER_DEP_DEV,
  CLUSTER_DEP_OPTIONAL,
  CLUSTER_DEP_PROD,
} from '../../constants'

interface BunPackageMetadata {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

type BunPackageTuple = [
  spec: string,
  tarball: string,
  metadata?: BunPackageMetadata | null,
  integrity?: string,
]

interface BunWorkspace {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

interface BunLockfile {
  lockfileVersion: number
  workspaces?: Record<string, BunWorkspace>
  packages?: Record<string, BunPackageTuple>
}

interface BunPackageInfo {
  key: string
  spec: string
  name: string
  version: string
  metadata: BunPackageMetadata
}

type ClusterIterable = Iterable<string>

async function getBunVersion(options: ListPackageDependenciesOptions) {
  try {
    const raw = await x('bun', ['--version'], {
      throwOnError: true,
      nodeOptions: { cwd: options.cwd },
    })
    return raw.stdout.trim()
  }
  catch (err) {
    console.error('Failed to get bun version')
    console.error(err)
    return undefined
  }
}

async function readBunLockfile(root: string): Promise<BunLockfile | null> {
  const lockfilePath = join(root, 'bun.lock')
  const lockbPath = join(root, 'bun.lockb')

  if (fs.existsSync(lockfilePath)) {
    try {
      const content = await fs.promises.readFile(lockfilePath, 'utf-8')
      // bun.lock is JSON-like with trailing commas that Bun accepts but JSON.parse does not.
      const cleanedContent = content.replace(/,(\s*[}\]])/g, '$1')
      return JSON.parse(cleanedContent)
    }
    catch (err) {
      console.error('Failed to parse bun.lock')
      console.error(err)
    }
  }

  if (fs.existsSync(lockbPath)) {
    throw new Error(
      'Binary bun.lockb format is not supported. Please use the new bun.lock format. https://bun.sh/docs/install/lockfile',
    )
  }

  return null
}

function parseSpec(spec: string) {
  const atIndex = spec.lastIndexOf('@')
  if (atIndex <= 0)
    return { name: spec, version: '0.0.0' }
  return {
    name: spec.slice(0, atIndex),
    version: spec.slice(atIndex + 1) || '0.0.0',
  }
}

function splitPackageKey(key: string): string[] {
  const result: string[] = []
  let index = 0
  while (index < key.length) {
    if (key[index] === '@') {
      const scopeEnd = key.indexOf('/', index + 1)
      if (scopeEnd === -1) {
        result.push(key.slice(index))
        break
      }
      const nameEnd = key.indexOf('/', scopeEnd + 1)
      if (nameEnd === -1) {
        result.push(key.slice(index))
        break
      }
      result.push(key.slice(index, nameEnd))
      index = nameEnd + 1
    }
    else {
      const nextSlash = key.indexOf('/', index)
      if (nextSlash === -1) {
        result.push(key.slice(index))
        break
      }
      result.push(key.slice(index, nextSlash))
      index = nextSlash + 1
    }
  }
  return result
}

function resolvePackageFilepath(root: string, key: string) {
  const packages = splitPackageKey(key)
  if (!packages.length)
    return join(root, 'node_modules')
  const parts: string[] = [root]
  for (const pkg of packages) {
    parts.push('node_modules')
    if (pkg.startsWith('@')) {
      const slash = pkg.indexOf('/')
      if (slash === -1) {
        parts.push(pkg)
      }
      else {
        parts.push(pkg.slice(0, slash))
        parts.push(pkg.slice(slash + 1))
      }
    }
    else {
      parts.push(pkg)
    }
  }
  return join(...parts)
}

function composeChildKey(parent: string, dependency: string) {
  return parent ? `${parent}/${dependency}` : dependency
}

function withCluster(clusters: ClusterIterable, cluster: string): Set<string> {
  const set = new Set(clusters)
  set.add(cluster)
  return set
}

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  const root = options.cwd
  const lockfile = await readBunLockfile(root)

  if (!lockfile)
    throw new Error('Could not find or parse bun.lock file')

  const packages = new Map<string, PackageNodeRaw>()
  const processedSpecs = new Set<string>()

  const packageInfoByKey = new Map<string, BunPackageInfo>()
  const packageKeysByName = new Map<string, string[]>()

  Object.entries(lockfile.packages ?? {}).forEach(([key, tuple]) => {
    const [spec, , metadata] = tuple
    const { name, version } = parseSpec(spec)
    const info: BunPackageInfo = {
      key,
      spec,
      name,
      version,
      metadata: metadata || {},
    }
    packageInfoByKey.set(key, info)
    const existing = packageKeysByName.get(name)
    if (existing)
      existing.push(key)
    else
      packageKeysByName.set(name, [key])
  })

  function resolveDependencyKey(parentKey: string | null, dependency: string) {
    if (parentKey) {
      const scopedKey = composeChildKey(parentKey, dependency)
      if (packageInfoByKey.has(scopedKey))
        return scopedKey
    }

    const candidates = packageKeysByName.get(dependency)
    if (candidates && candidates.length) {
      if (parentKey) {
        const nested = candidates.find(candidate => candidate.startsWith(`${parentKey}/`))
        if (nested)
          return nested
      }
      const direct = candidates.find(candidate => candidate === dependency)
      if (direct)
        return direct
      return candidates[0]
    }

    if (!parentKey && packageInfoByKey.has(dependency))
      return dependency

    return undefined
  }

  function getOrCreateNode(info: BunPackageInfo): PackageNodeRaw {
    let node = packages.get(info.spec)
    if (node)
      return node

    node = {
      spec: info.spec,
      name: info.name,
      version: info.version,
      filepath: resolvePackageFilepath(root, info.key),
      dependencies: new Set(),
      workspace: false,
      clusters: new Set(),
    }

    packages.set(node.spec, node)
    return node
  }

  function traverse(key: string, clusters: ClusterIterable): PackageNodeRaw | undefined {
    const info = packageInfoByKey.get(key)
    if (!info)
      return undefined

    const node = getOrCreateNode(info)

    if (!node.workspace) {
      for (const cluster of clusters)
        node.clusters.add(cluster)
    }

    if (options.traverseFilter?.(node) === false)
      return node

    if (processedSpecs.has(node.spec))
      return node
    processedSpecs.add(node.spec)

    if (options.dependenciesFilter?.(node) === false)
      return node

    const directDependencies = Object.keys(info.metadata.dependencies ?? {})
    for (const dependency of directDependencies) {
      const childKey = resolveDependencyKey(key, dependency)
      if (!childKey)
        continue
      const childNode = traverse(childKey, clusters)
      if (childNode)
        node.dependencies.add(childNode.spec)
    }

    const optionalDependencies = Object.keys(info.metadata.optionalDependencies ?? {})
    if (optionalDependencies.length) {
      const clusterWithOptional = withCluster(clusters, CLUSTER_DEP_OPTIONAL)
      for (const dependency of optionalDependencies) {
        const childKey = resolveDependencyKey(key, dependency)
        if (!childKey)
          continue
        const childNode = traverse(childKey, clusterWithOptional)
        if (childNode)
          node.dependencies.add(childNode.spec)
      }
    }

    return node
  }

  const workspaceEntries = Object.entries(lockfile.workspaces ?? {})
  if (!workspaceEntries.length)
    workspaceEntries.push(['', {}])

  const workspaceNodeByName = new Map<string, PackageNodeRaw>()
  const workspacePackages = await Promise.all(workspaceEntries.map(async ([workspacePath, workspace], index) => {
    const workspaceData = workspace ?? {}
    let name = workspaceData.name
    const workspaceRoot = join(root, workspacePath)

    if (!name) {
      let path = relative(root, workspaceRoot)
      if (path === '.')
        path = ''
      const suffix = path.toLowerCase().replace(/[^a-z0-9-]+/g, '_').slice(0, 20)
      name = suffix ? `#workspace-${suffix}` : (index === 0 ? '#workspace-root' : `#workspace-${index + 1}`)
    }

    const packageJsonPath = join(workspaceRoot, 'package.json')
    let version = '0.0.0'
    let isPrivate = false

    if (fs.existsSync(packageJsonPath)) {
      try {
        const raw = await fs.promises.readFile(packageJsonPath, 'utf-8')
        const pkg = JSON.parse(raw) as { name?: string, version?: string, private?: boolean }
        if (!workspaceData.name && pkg.name)
          name = pkg.name
        if (pkg.version)
          version = pkg.version
        if (pkg.private)
          isPrivate = true
      }
      catch {
        // ignore JSON parse errors
      }
    }

    const spec = `${name}@${version}`
    const node: PackageNodeRaw = {
      spec,
      name,
      version,
      filepath: workspaceRoot,
      dependencies: new Set(),
      workspace: true,
      clusters: new Set(),
    }

    if (isPrivate)
      node.private = true

    packages.set(spec, node)
    workspaceNodeByName.set(name, node)

    return { workspace: workspaceData, node }
  }))

  for (const { workspace, node } of workspacePackages) {
    const depGroups: Array<{ entries: Record<string, string> | undefined, clusters: ClusterIterable }> = [
      { entries: workspace.dependencies, clusters: [CLUSTER_DEP_PROD] },
      { entries: workspace.devDependencies, clusters: [CLUSTER_DEP_DEV] },
      { entries: workspace.optionalDependencies, clusters: [CLUSTER_DEP_OPTIONAL] },
    ]

    for (const { entries, clusters } of depGroups) {
      if (!entries)
        continue

      for (const dependency of Object.keys(entries)) {
        const workspaceNode = workspaceNodeByName.get(dependency)
        if (workspaceNode) {
          // Bun lockfiles do not duplicate workspace entries under `packages`.
          node.dependencies.add(workspaceNode.spec)
          continue
        }

        const childKey = resolveDependencyKey(null, dependency)
        if (!childKey)
          continue
        const childNode = traverse(childKey, clusters)
        if (childNode)
          node.dependencies.add(childNode.spec)
      }
    }
  }

  return {
    root,
    packageManager: 'bun',
    packageManagerVersion: await getBunVersion(options),
    packages,
  }
}

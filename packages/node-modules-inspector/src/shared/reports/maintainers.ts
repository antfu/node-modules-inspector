import type { PackageNode, PublintMessage } from 'node-modules-tools'
import type { ParsedAuthor } from 'node-modules-tools/utils'
import { getMajor, getPrerelease, isGreaterThanRange, satisfies } from 'verkit'
import { compareSemver } from '../semver'

export function authorKey(author: ParsedAuthor): string {
  return author.type === 'github' ? `@${author.github}` : author.name
}

interface BaseAction {
  consumer: PackageNode
  depth: number
  key: string
}

export interface DepUpgradeAction extends BaseAction {
  kind: 'dep-upgrade'
  depName: string
  depType: 'peer' | 'prod'
  /** The effective semver range (after resolving any catalog reference). */
  declaredRange: string
  /** The raw range as written in package.json, when it differs (e.g. `catalog:deps`). */
  rawRange?: string
  /** Catalog name when the raw range was a catalog reference. */
  catalogName?: string
  installedHighestVersion: string
  installedHighest: PackageNode
  installedVersions: string[]
  migratedCount: number
  totalCount: number
  migrationRatio: number
}

export interface PublintAction extends BaseAction {
  kind: 'publint'
  messages: PublintMessage[]
  counts: { error: number, warning: number, suggestion: number }
}

export type MaintainerActionItem = DepUpgradeAction | PublintAction

export type MaintainerActionSortMode = 'depth' | 'migration' | 'latest'

export interface MaintainerActionGroup {
  consumer: PackageNode
  depth: number
  authors: ParsedAuthor[]
  items: MaintainerActionItem[]
  maxMigrationRatio: number
  latestReleasedAt: number
}

export interface MaintainerActionAuthorEntry {
  author: ParsedAuthor
  count: number
}

interface DepStats {
  highestVersion: string
  highestPkg: PackageNode
  versions: string[]
  migrated: number
  behind: number
}

const NON_SEMVER_PREFIXES = ['workspace:', 'link:', 'file:', 'npm:', 'git+', 'git:', 'http:', 'https:', 'github:']

function resolveCatalogRange(
  range: string,
  depName: string,
  catalogs: Record<string, Record<string, string>> | undefined,
): string | undefined {
  if (!range.startsWith('catalog:'))
    return range
  if (!catalogs)
    return undefined
  const name = range.slice('catalog:'.length) || 'default'
  return catalogs[name]?.[depName]
}

function isPlainSemverRange(range: string | undefined): range is string {
  if (!range || range === '*' || range === 'latest' || range === 'x')
    return false
  return !NON_SEMVER_PREFIXES.some(p => range.startsWith(p))
}

function safeSatisfies(version: string, range: string) {
  try {
    return satisfies(version, range)
  }
  catch {
    return null
  }
}

function safeGtr(version: string, range: string) {
  try {
    return isGreaterThanRange(version, range)
  }
  catch {
    return null
  }
}

function isStable(version: string) {
  return getPrerelease(version) === null
}

function getPublintMessagesFor(
  pkg: PackageNode,
  fallback?: (pkg: PackageNode) => PublintMessage[] | null,
): PublintMessage[] | null {
  if (pkg.resolved.publint)
    return pkg.resolved.publint
  return fallback?.(pkg) ?? null
}

export interface MaintainerActionsInput {
  packages: Iterable<PackageNode>
  versions: Map<string, PackageNode[]>
  catalogs?: Record<string, Record<string, string>>
  publintFallback?: (pkg: PackageNode) => PublintMessage[] | null
}

export function computeMaintainerActions(input: MaintainerActionsInput): MaintainerActionItem[] {
  const { catalogs, publintFallback, versions } = input
  const packages = Array.from(input.packages)
  const stats = new Map<string, DepStats | null>()

  function getStats(depName: string): DepStats | null {
    if (stats.has(depName))
      return stats.get(depName)!
    const installed = versions.get(depName)
    if (!installed?.length) {
      stats.set(depName, null)
      return null
    }
    const sortedAll = installed.slice().sort((a, b) => compareSemver(a.version, b.version))
    const stable = sortedAll.filter(p => isStable(p.version))
    if (!stable.length) {
      stats.set(depName, null)
      return null
    }
    const highestPkg = stable.at(-1)!
    const entry: DepStats = {
      highestVersion: highestPkg.version,
      highestPkg,
      versions: sortedAll.map(p => p.version),
      migrated: 0,
      behind: 0,
    }
    stats.set(depName, entry)
    return entry
  }

  for (const consumer of packages) {
    const pj = consumer.resolved.packageJson
    const blocks = [pj.peerDependencies, pj.dependencies]
    for (const block of blocks) {
      if (!block)
        continue
      for (const [depName, rawRange] of Object.entries(block)) {
        const range = resolveCatalogRange(rawRange, depName, catalogs)
        if (!isPlainSemverRange(range))
          continue
        const entry = getStats(depName)
        if (!entry)
          continue
        if (safeSatisfies(entry.highestVersion, range)) {
          entry.migrated++
        }
        else if (safeGtr(entry.highestVersion, range)) {
          entry.behind++
        }
        // else: declared range is ahead of highest stable — ignore (not part of this cohort)
      }
    }
  }

  const items: MaintainerActionItem[] = []

  for (const consumer of packages) {
    const pj = consumer.resolved.packageJson
    const blocks: Array<[Record<string, string> | undefined, 'peer' | 'prod']> = [
      [pj.peerDependencies, 'peer'],
      [pj.dependencies, 'prod'],
    ]
    for (const [block, depType] of blocks) {
      if (!block)
        continue
      for (const [depName, rawRange] of Object.entries(block)) {
        const declaredRange = resolveCatalogRange(rawRange, depName, catalogs)
        if (!isPlainSemverRange(declaredRange))
          continue
        const entry = stats.get(depName)
        if (!entry)
          continue
        if (safeGtr(entry.highestVersion, declaredRange) !== true)
          continue
        // Skip when consumer and dep share the same repository (monorepo siblings).
        const consumerRepo = consumer.resolved.repository?.url
        const depRepo = entry.highestPkg.resolved.repository?.url
        if (consumerRepo && depRepo && consumerRepo === depRepo)
          continue
        const total = entry.migrated + entry.behind
        const catalogName = rawRange.startsWith('catalog:')
          ? (rawRange.slice('catalog:'.length) || 'default')
          : undefined
        items.push({
          kind: 'dep-upgrade',
          consumer,
          depName,
          depType,
          declaredRange,
          rawRange: rawRange === declaredRange ? undefined : rawRange,
          catalogName,
          installedHighestVersion: entry.highestVersion,
          installedHighest: entry.highestPkg,
          installedVersions: entry.versions,
          migratedCount: entry.migrated,
          totalCount: total,
          migrationRatio: total ? entry.migrated / total : 0,
          depth: consumer.depth,
          key: `${consumer.spec}::${depType}::${depName}`,
        })
      }
    }
  }

  for (const consumer of packages) {
    const messages = getPublintMessagesFor(consumer, publintFallback)
    if (!messages?.length)
      continue
    const counts = { error: 0, warning: 0, suggestion: 0 }
    for (const m of messages)
      counts[m.type]++
    items.push({
      kind: 'publint',
      consumer,
      depth: consumer.depth,
      key: `${consumer.spec}::publint`,
      messages,
      counts,
    })
  }

  return items
}

function getConsumerAuthors(pkg: PackageNode): ParsedAuthor[] {
  const list = pkg.resolved.authors
  if (!list?.length)
    return []
  return list.filter(a => a.type === 'github' || !!a.name?.trim())
}

function actionSortKey(a: MaintainerActionItem, b: MaintainerActionItem): number {
  if (a.kind !== b.kind)
    return a.kind === 'publint' ? -1 : 1
  if (a.kind === 'dep-upgrade' && b.kind === 'dep-upgrade') {
    return (b.migrationRatio - a.migrationRatio)
      || a.depName.localeCompare(b.depName)
  }
  return 0
}

function defaultPublishTimeOf(pkg: PackageNode): Date | undefined {
  const t = pkg.resolved.npmMeta?.publishedAt
  return t ? new Date(t) : undefined
}

export interface MaintainerGroupOptions {
  sort?: MaintainerActionSortMode
  authorFilter?: string[]
  includePublint?: boolean
  latestOnly?: boolean
  /** Resolve the latest published version for the package; required for `latestOnly` filter. */
  latestVersionOf?: (pkg: PackageNode) => string | undefined
  /** Resolve the publish time for the package; defaults to `pkg.resolved.npmMeta.publishedAt`. */
  publishTimeOf?: (pkg: PackageNode) => Date | undefined | null
}

export function groupMaintainerActions(
  items: MaintainerActionItem[],
  options: MaintainerGroupOptions = {},
): MaintainerActionGroup[] {
  const publishTimeOf = options.publishTimeOf ?? defaultPublishTimeOf
  const byConsumer = new Map<string, MaintainerActionGroup>()
  for (const item of items) {
    let group = byConsumer.get(item.consumer.spec)
    if (!group) {
      group = {
        consumer: item.consumer,
        depth: item.consumer.depth,
        authors: getConsumerAuthors(item.consumer),
        items: [],
        maxMigrationRatio: 0,
        latestReleasedAt: publishTimeOf(item.consumer)?.getTime() ?? 0,
      }
      byConsumer.set(item.consumer.spec, group)
    }
    group.items.push(item)
    if (item.kind === 'dep-upgrade' && item.migrationRatio > group.maxMigrationRatio)
      group.maxMigrationRatio = item.migrationRatio
  }

  for (const group of byConsumer.values())
    group.items.sort(actionSortKey)

  const byName = new Map<string, MaintainerActionGroup>()
  for (const g of byConsumer.values()) {
    const cur = byName.get(g.consumer.name)
    if (!cur || compareSemver(cur.consumer.version, g.consumer.version) < 0)
      byName.set(g.consumer.name, g)
  }
  let groups = Array.from(byName.values())

  const selected = options.authorFilter
  if (selected?.length) {
    const set = new Set(selected)
    groups = groups.filter(g => g.authors.some(a => set.has(authorKey(a))))
  }

  if (options.includePublint === false) {
    groups = groups
      .map((g) => {
        const items = g.items.filter(i => i.kind !== 'publint')
        return items.length === g.items.length ? g : { ...g, items }
      })
      .filter(g => g.items.length > 0)
  }

  if (options.latestOnly && options.latestVersionOf) {
    const latestVersionOf = options.latestVersionOf
    groups = groups.filter((g) => {
      const latest = latestVersionOf(g.consumer)
      if (!latest)
        return true
      try {
        return getMajor(g.consumer.version) === getMajor(latest)
      }
      catch {
        return true
      }
    })
  }

  const mode = options.sort ?? 'depth'
  const nameTie = (a: MaintainerActionGroup, b: MaintainerActionGroup) =>
    a.consumer.name.localeCompare(b.consumer.name)
  const cmp: (a: MaintainerActionGroup, b: MaintainerActionGroup) => number
    = mode === 'migration'
      ? (a, b) => (b.maxMigrationRatio - a.maxMigrationRatio) || (a.depth - b.depth) || nameTie(a, b)
      : mode === 'latest'
        ? (a, b) => (b.latestReleasedAt - a.latestReleasedAt) || (a.depth - b.depth) || nameTie(a, b)
        : (a, b) => (a.depth - b.depth) || (b.maxMigrationRatio - a.maxMigrationRatio) || nameTie(a, b)
  return groups.sort(cmp)
}

export function collectMaintainerActionAuthors(
  groups: MaintainerActionGroup[],
): MaintainerActionAuthorEntry[] {
  const map = new Map<string, MaintainerActionAuthorEntry>()
  for (const group of groups) {
    for (const author of group.authors) {
      const key = authorKey(author)
      const entry = map.get(key)
      if (entry)
        entry.count++
      else
        map.set(key, { author, count: 1 })
    }
  }
  return Array.from(map.values())
    .sort((a, b) => (b.count - a.count) || authorKey(a.author).localeCompare(authorKey(b.author)))
}

import type { PackageNode, PublintMessage } from 'node-modules-tools'
import semver from 'semver'
import { computed } from 'vue'
import { compareSemver } from '../utils/semver'
import { rawPayload, rawPublintMessages } from './data'
import { payloads } from './payload'
import { query } from './query'

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
    return semver.satisfies(version, range)
  }
  catch {
    return null
  }
}

function safeGtr(version: string, range: string) {
  try {
    return semver.gtr(version, range)
  }
  catch {
    return null
  }
}

function isStable(version: string) {
  return semver.prerelease(version) === null
}

function getPublintMessagesFor(pkg: PackageNode): PublintMessage[] | null {
  if (pkg.resolved.publint)
    return pkg.resolved.publint
  const fetched = rawPublintMessages.value.get(pkg.spec)
  return fetched ? [...fetched] : null
}

export const maintainerActions = computed<MaintainerActionItem[]>(() => {
  const packages = payloads.filtered.packages
  const versions = payloads.filtered.versions
  const catalogs = rawPayload.value?.catalogs

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
    const messages = getPublintMessagesFor(consumer)
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
})

export function findMaintainerActionByKey(key: string | undefined): MaintainerActionItem | undefined {
  if (!key)
    return undefined
  return maintainerActions.value.find(i => i.key === key)
}

export interface MaintainerActionGroup {
  consumer: PackageNode
  depth: number
  authors: string[]
  items: MaintainerActionItem[]
  maxMigrationRatio: number
}

function getConsumerAuthors(pkg: PackageNode): string[] {
  const list = pkg.resolved.authors
  if (!list?.length)
    return []
  return list
    .map(a => a.type === 'github' ? `@${a.github}` : a.name?.trim())
    .filter((n): n is string => !!n)
}

function actionSortKey(a: MaintainerActionItem, b: MaintainerActionItem): number {
  if (a.kind !== b.kind)
    return a.kind === 'dep-upgrade' ? -1 : 1
  if (a.kind === 'dep-upgrade' && b.kind === 'dep-upgrade') {
    return (b.migrationRatio - a.migrationRatio)
      || a.depName.localeCompare(b.depName)
  }
  return 0
}

export const maintainerActionGroups = computed<MaintainerActionGroup[]>(() => {
  const byConsumer = new Map<string, MaintainerActionGroup>()
  for (const item of maintainerActions.value) {
    let group = byConsumer.get(item.consumer.spec)
    if (!group) {
      group = {
        consumer: item.consumer,
        depth: item.consumer.depth,
        authors: getConsumerAuthors(item.consumer),
        items: [],
        maxMigrationRatio: 0,
      }
      byConsumer.set(item.consumer.spec, group)
    }
    group.items.push(item)
    if (item.kind === 'dep-upgrade' && item.migrationRatio > group.maxMigrationRatio)
      group.maxMigrationRatio = item.migrationRatio
  }

  for (const group of byConsumer.values())
    group.items.sort(actionSortKey)

  return Array.from(byConsumer.values()).sort((a, b) =>
    (a.depth - b.depth)
    || (b.maxMigrationRatio - a.maxMigrationRatio)
    || a.consumer.name.localeCompare(b.consumer.name),
  )
})

export const maintainerActionAuthors = computed<string[]>(() => {
  const set = new Set<string>()
  for (const group of maintainerActionGroups.value) {
    for (const author of group.authors)
      set.add(author)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

export const maintainerFilter = computed<string[]>({
  get: () => query.selectedAuthors ? query.selectedAuthors.split(',').filter(Boolean) : [],
  set: (v) => {
    query.selectedAuthors = v.length ? v.join(',') : undefined
  },
})

export const viewAllMaintainerActions = computed<boolean>({
  get: () => query.actionAll === 'true',
  set: (v) => {
    query.actionAll = v ? 'true' : undefined
  },
})

export const filteredMaintainerActionGroups = computed<MaintainerActionGroup[]>(() => {
  const selected = maintainerFilter.value
  if (!selected.length)
    return maintainerActionGroups.value
  const set = new Set(selected)
  return maintainerActionGroups.value.filter(g => g.authors.some(a => set.has(a)))
})

export function getMaintainerActionsFor(pkg: PackageNode): MaintainerActionItem[] {
  const group = maintainerActionGroups.value.find(g => g.consumer.spec === pkg.spec)
  return group?.items || []
}

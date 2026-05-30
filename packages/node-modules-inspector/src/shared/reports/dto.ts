import type { PackageInstallSizeInfo, PublintMessage } from 'node-modules-tools'
import type { ParsedAuthor } from 'node-modules-tools/utils'
import type {
  MaintainerActionGroup,
  MaintainerActionItem,
} from './maintainers'

export interface ReportConsumerDto {
  spec: string
  name: string
  version: string
  depth: number
}

export type MaintainerActionItemDto
  = | MaintainerActionDepUpgradeDto
    | MaintainerActionPublintDto

export interface MaintainerActionDepUpgradeDto {
  kind: 'dep-upgrade'
  depName: string
  depType: 'peer' | 'prod'
  declaredRange: string
  rawRange?: string
  catalogName?: string
  installedHighestVersion: string
  installedHighestSpec: string
  installedVersions: string[]
  migratedCount: number
  totalCount: number
  migrationRatio: number
}

export interface MaintainerActionPublintDto {
  kind: 'publint'
  messages: PublintMessage[]
  counts: { error: number, warning: number, suggestion: number }
}

export interface MaintainersGroupDto {
  consumer: ReportConsumerDto
  authors: ParsedAuthor[]
  items: MaintainerActionItemDto[]
  maxMigrationRatio: number
  latestReleasedAt: number
}

export function toMaintainerItemDto(item: MaintainerActionItem): MaintainerActionItemDto {
  if (item.kind === 'publint') {
    return {
      kind: 'publint',
      messages: item.messages,
      counts: item.counts,
    }
  }
  return {
    kind: 'dep-upgrade',
    depName: item.depName,
    depType: item.depType,
    declaredRange: item.declaredRange,
    rawRange: item.rawRange,
    catalogName: item.catalogName,
    installedHighestVersion: item.installedHighestVersion,
    installedHighestSpec: item.installedHighest.spec,
    installedVersions: item.installedVersions,
    migratedCount: item.migratedCount,
    totalCount: item.totalCount,
    migrationRatio: item.migrationRatio,
  }
}

export function toMaintainersGroupDto(group: MaintainerActionGroup): MaintainersGroupDto {
  return {
    consumer: {
      spec: group.consumer.spec,
      name: group.consumer.name,
      version: group.consumer.version,
      depth: group.depth,
    },
    authors: group.authors,
    items: group.items.map(toMaintainerItemDto),
    maxMigrationRatio: group.maxMigrationRatio,
    latestReleasedAt: group.latestReleasedAt,
  }
}

export interface DuplicatesEntry {
  name: string
  versions: string[]
  specs: string[]
}

export interface SizesEntry {
  spec: string
  name: string
  version: string
  workspace: boolean
  bytes: number
  categories: PackageInstallSizeInfo['categories']
}

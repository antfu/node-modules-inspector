import type { PackageNode } from 'node-modules-tools'
import type {
  MaintainerActionGroup,
  MaintainerActionItem,
  MaintainerActionSortMode,
} from '../../shared/reports/maintainers'
import { computed } from 'vue'
import {
  collectMaintainerActionAuthors,
  computeMaintainerActions,
  groupMaintainerActions,
} from '../../shared/reports/maintainers'
import { rawPayload, rawPublintMessages } from './data'
import { getNpmMetaLatest, getPublishTime, payloads } from './payload'
import { query } from './query'

export {
  authorKey,
} from '../../shared/reports/maintainers'
export type {
  DepUpgradeAction,
  MaintainerActionAuthorEntry,
  MaintainerActionGroup,
  MaintainerActionItem,
  MaintainerActionSortMode,
  PublintAction,
} from '../../shared/reports/maintainers'

export const maintainerActions = computed<MaintainerActionItem[]>(() => {
  return computeMaintainerActions({
    packages: payloads.filtered.packages,
    versions: payloads.filtered.versions,
    catalogs: rawPayload.value?.catalogs,
    publintFallback: (pkg) => {
      const fetched = rawPublintMessages.value.get(pkg.spec)
      return fetched ? [...fetched] : null
    },
  })
})

export function findMaintainerActionByKey(key: string | undefined): MaintainerActionItem | undefined {
  if (!key)
    return undefined
  return maintainerActions.value.find(i => i.key === key)
}

export const maintainerActionSortMode = computed<MaintainerActionSortMode>({
  get: () => {
    const v = query.actionSort
    return v === 'migration' || v === 'latest' ? v : 'depth'
  },
  set: (v) => {
    query.actionSort = v === 'depth' ? undefined : v
  },
})

export const maintainerActionGroups = computed<MaintainerActionGroup[]>(() => {
  return groupMaintainerActions(maintainerActions.value, {
    sort: maintainerActionSortMode.value,
    publishTimeOf: pkg => getPublishTime(pkg) ?? undefined,
  })
})

export const maintainerActionAuthors = computed(() => {
  return collectMaintainerActionAuthors(maintainerActionGroups.value)
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

export const maintainerActionIncludePublint = computed<boolean>({
  get: () => query.actionIncludePublint !== 'false',
  set: (v) => {
    query.actionIncludePublint = v ? undefined : 'false'
  },
})

export const maintainerActionLatestOnly = computed<boolean>({
  get: () => query.actionLatestOnly !== 'false',
  set: (v) => {
    query.actionLatestOnly = v ? undefined : 'false'
  },
})

export const filteredMaintainerActionGroups = computed<MaintainerActionGroup[]>(() => {
  return groupMaintainerActions(maintainerActions.value, {
    sort: maintainerActionSortMode.value,
    authorFilter: maintainerFilter.value,
    includePublint: maintainerActionIncludePublint.value,
    latestOnly: maintainerActionLatestOnly.value,
    latestVersionOf: pkg => getNpmMetaLatest(pkg)?.version,
    publishTimeOf: pkg => getPublishTime(pkg) ?? undefined,
  })
})

export function getMaintainerActionsFor(pkg: PackageNode): MaintainerActionItem[] {
  const group = maintainerActionGroups.value.find(g => g.consumer.spec === pkg.spec)
  return group?.items || []
}

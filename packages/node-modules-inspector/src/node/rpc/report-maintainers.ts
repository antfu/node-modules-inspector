import type { PackageNode } from 'node-modules-tools'
import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'
import * as v from 'valibot'
import { toMaintainersGroupDto } from '../../shared/reports/dto'
import {
  computeMaintainerActions,
  groupMaintainerActions,
} from '../../shared/reports/maintainers'

const argsSchema = v.optional(v.object({
  sort: v.optional(v.picklist(['depth', 'migration', 'latest']), 'depth'),
  authors: v.optional(v.array(v.string()), []),
  includePublint: v.optional(v.boolean(), true),
  latestOnly: v.optional(v.boolean(), true),
  limit: v.optional(v.number()),
}), {})

const returnsSchema = v.array(v.object({
  consumer: v.object({
    spec: v.string(),
    name: v.string(),
    version: v.string(),
    depth: v.number(),
  }),
  authors: v.array(v.unknown()),
  items: v.array(v.unknown()),
  maxMigrationRatio: v.number(),
  latestReleasedAt: v.number(),
}))

function buildVersionsMap(packages: Iterable<PackageNode>): Map<string, PackageNode[]> {
  const map = new Map<string, PackageNode[]>()
  for (const pkg of packages) {
    let bucket = map.get(pkg.name)
    if (!bucket) {
      bucket = []
      map.set(pkg.name, bucket)
    }
    bucket.push(pkg)
  }
  return map
}

export function reportMaintainersRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:report-maintainers',
    type: 'query',
    jsonSerializable: true,
    args: [argsSchema],
    returns: returnsSchema,
    agent: {
      description: 'Maintenance actions per consumer package: dep-upgrade opportunities (when an installed dependency has a newer version that the consumer\'s range does not satisfy) and publint findings. Grouped by consumer, sorted by depth/migration/latest. Read-only.',
    },
    handler: (async (raw: {
      sort?: 'depth' | 'migration' | 'latest'
      authors?: string[]
      includePublint?: boolean
      latestOnly?: boolean
      limit?: number
    } = {}) => {
      const opts = {
        sort: 'depth' as 'depth' | 'migration' | 'latest',
        authors: [] as string[],
        includePublint: true,
        latestOnly: true,
        limit: undefined as number | undefined,
        ...raw,
      }
      const payload = await handlers.getPayload()
      const packages = Array.from(payload.packages.values())
      const versions = buildVersionsMap(packages)

      const items = computeMaintainerActions({
        packages,
        versions,
        catalogs: payload.catalogs,
      })

      const groups = groupMaintainerActions(items, {
        sort: opts.sort,
        authorFilter: opts.authors.length ? opts.authors : undefined,
        includePublint: opts.includePublint,
        latestOnly: opts.latestOnly,
        latestVersionOf: pkg => pkg.resolved.npmMetaLatest?.version,
      })

      const limited = opts.limit && opts.limit > 0 ? groups.slice(0, opts.limit) : groups
      return limited.map(toMaintainersGroupDto)
    }) as any,
  })
}

import type { PackageNode } from 'node-modules-tools'
import process from 'node:process'
import c from 'ansis'
import { toMaintainersGroupDto } from '../../shared/reports/dto'
import { computeDuplicates } from '../../shared/reports/duplicates'
import {
  computeMaintainerActions,
  groupMaintainerActions,
} from '../../shared/reports/maintainers'
import { computeInstallSizes } from '../../shared/reports/sizes'
import { createInspectorRpcHandlers } from '../rpc/handlers'
import { storageNpmMeta, storageNpmMetaLatest, storagePublint } from '../storage'
import { formatDuplicates } from './format-duplicates'
import { formatMaintainers } from './format-maintainers'
import { formatSizes } from './format-sizes'

export type ReportType = 'maintainers' | 'duplicates' | 'sizes'

export interface RunReportOptions {
  type: ReportType
  root: string
  config?: string
  depth: number
  json: boolean
  /** Common to all */
  limit?: number
  /** Maintainers-only */
  sort?: 'depth' | 'migration' | 'latest'
  authors?: string[]
  includePublint?: boolean
  latestOnly?: boolean
  /** Duplicates-only */
  minVersions?: number
  /** Sizes-only */
  includeWorkspace?: boolean
}

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

export async function runReport(options: RunReportOptions): Promise<void> {
  const handlers = createInspectorRpcHandlers({
    cwd: options.root,
    depth: options.depth,
    configFile: options.config,
    mode: 'build',
    quiet: true,
    storageNpmMeta,
    storageNpmMetaLatest,
    storagePublint,
  })

  let payload
  try {
    payload = await handlers.getPayload()
  }
  catch (error: any) {
    console.error(c.red`✖ ${error.message || error}`)
    process.exit(1)
  }

  if (options.type === 'duplicates') {
    const data = computeDuplicates(payload.packages.values(), {
      minVersions: options.minVersions,
      limit: options.limit,
    })
    write(options.json ? toJson(data) : formatDuplicates(data))
    return
  }

  if (options.type === 'sizes') {
    const data = computeInstallSizes(payload.packages.values(), {
      limit: options.limit,
      includeWorkspace: options.includeWorkspace,
    })
    write(options.json ? toJson(data) : formatSizes(data))
    return
  }

  if (options.type === 'maintainers') {
    const packages = Array.from(payload.packages.values())
    const versions = buildVersionsMap(packages)
    const items = computeMaintainerActions({
      packages,
      versions,
      catalogs: payload.catalogs,
    })
    const groups = groupMaintainerActions(items, {
      sort: options.sort,
      authorFilter: options.authors?.length ? options.authors : undefined,
      includePublint: options.includePublint,
      latestOnly: options.latestOnly,
      latestVersionOf: pkg => pkg.resolved.npmMetaLatest?.version,
    })
    const limited = options.limit && options.limit > 0 ? groups.slice(0, options.limit) : groups
    const dto = limited.map(toMaintainersGroupDto)
    write(options.json ? toJson(dto) : formatMaintainers(dto))
    return
  }

  console.error(c.red`✖ Unknown report type "${options.type}". Expected one of: maintainers, duplicates, sizes.`)
  process.exit(1)
}

function toJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`
}

function write(text: string): void {
  process.stdout.write(text.endsWith('\n') ? text : `${text}\n`)
}

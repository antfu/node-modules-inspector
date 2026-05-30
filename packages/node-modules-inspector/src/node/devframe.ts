import process from 'node:process'
import { defineDevframe } from 'devframe/types'
import { distDir } from '../dirs'
import { getPackagesNpmMetaRpc } from './rpc/get-packages-npm-meta'
import { getPackagesNpmMetaLatestRpc } from './rpc/get-packages-npm-meta-latest'
import { getPayloadRpc } from './rpc/get-payload'
import { getPublintRpc } from './rpc/get-publint'
import { createInspectorRpcHandlers } from './rpc/handlers'
import { openInEditorRpc } from './rpc/open-in-editor'
import { openInFinderRpc } from './rpc/open-in-finder'
import { reportDuplicatesRpc } from './rpc/report-duplicates'
import { reportMaintainersRpc } from './rpc/report-maintainers'
import { reportSizesRpc } from './rpc/report-sizes'
import { storageNpmMeta, storageNpmMetaLatest, storagePublint } from './storage'

export interface InspectorDevframeFlags {
  root?: string
  config?: string
  depth?: number
  quiet?: boolean
}

export default defineDevframe({
  id: 'node-modules-inspector',
  name: 'Node Modules Inspector',
  icon: 'ph:package-duotone',
  cli: {
    command: 'node-modules-inspector',
    distDir,
  },
  setup(ctx, info) {
    const flags = (info?.flags ?? {}) as InspectorDevframeFlags
    // MCP adapter calls setup() without flags. CLI mcp subcommand sets these env vars as a bridge.
    const envDepth = process.env.NMI_CLI_DEPTH ? Number(process.env.NMI_CLI_DEPTH) : undefined
    const handlers = createInspectorRpcHandlers({
      cwd: flags.root ?? ctx.cwd,
      depth: flags.depth ?? envDepth ?? 8,
      configFile: flags.config ?? process.env.NMI_CLI_CONFIG,
      mode: ctx.mode,
      quiet: flags.quiet ?? process.env.NMI_CLI_QUIET === '1',
      storageNpmMeta,
      storageNpmMetaLatest,
      storagePublint,
    })

    ctx.rpc.register(getPayloadRpc(handlers))
    ctx.rpc.register(getPackagesNpmMetaRpc(handlers))
    ctx.rpc.register(getPackagesNpmMetaLatestRpc(handlers))
    ctx.rpc.register(getPublintRpc(handlers))
    ctx.rpc.register(openInEditorRpc(handlers))
    ctx.rpc.register(openInFinderRpc(handlers))
    ctx.rpc.register(reportDuplicatesRpc(handlers))
    ctx.rpc.register(reportMaintainersRpc(handlers))
    ctx.rpc.register(reportSizesRpc(handlers))
  },
})

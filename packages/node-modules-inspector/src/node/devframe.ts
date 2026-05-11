import { defineDevframe } from 'devframe/types'
import { distDir } from '../dirs'
import { getPackagesNpmMetaRpc } from './rpc/get-packages-npm-meta'
import { getPackagesNpmMetaLatestRpc } from './rpc/get-packages-npm-meta-latest'
import { getPayloadRpc } from './rpc/get-payload'
import { getPublintRpc } from './rpc/get-publint'
import { createInspectorRpcHandlers } from './rpc/handlers'
import { openInEditorRpc } from './rpc/open-in-editor'
import { openInFinderRpc } from './rpc/open-in-finder'
import { storageNpmMeta, storageNpmMetaLatest, storagePublint } from './storage'

export interface InspectorDevframeFlags {
  root?: string
  config?: string
  depth?: number
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
    const handlers = createInspectorRpcHandlers({
      cwd: flags.root ?? ctx.cwd,
      depth: flags.depth ?? 8,
      configFile: flags.config,
      mode: ctx.mode,
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
  },
})

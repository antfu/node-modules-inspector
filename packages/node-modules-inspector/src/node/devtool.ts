import { defineRpcFunction } from 'devframe'
import { defineDevtool } from 'devframe/types'
import { stringify as structuredCloneStringify } from 'structured-clone-es'
import { distDir } from '../dirs'
import { createInspectorRpcHandlers } from './rpc'
import { storageNpmMeta, storageNpmMetaLatest, storagePublint } from './storage'

export interface InspectorDevtoolFlags {
  root?: string
  config?: string
  depth?: number
}

export default defineDevtool({
  id: 'node-modules-inspector',
  name: 'Node Modules Inspector',
  icon: 'ph:package-duotone',
  cli: {
    command: 'node-modules-inspector',
    distDir,
  },
  setup(ctx, info) {
    const flags = (info?.flags ?? {}) as InspectorDevtoolFlags
    const handlers = createInspectorRpcHandlers({
      cwd: flags.root ?? ctx.cwd,
      depth: flags.depth ?? 8,
      configFile: flags.config,
      mode: ctx.mode,
      storageNpmMeta,
      storageNpmMetaLatest,
      storagePublint,
    })

    // The payload contains Maps and Sets (`packages`, plus per-node
    // `dependencies`/`clusters`/`flatDependents`/...), which JSON.stringify
    // turns into empty objects. devframe's static dump uses plain JSON, so
    // we hand-serialize via structured-clone-es and parse on the client.
    // The dev WS transport already round-trips through structured-clone-es,
    // so the extra wrap is essentially free there.
    ctx.rpc.register(defineRpcFunction({
      name: 'nmi:get-payload',
      type: 'query',
      snapshot: true,
      handler: async (force?: boolean) => structuredCloneStringify(await handlers.getPayload(force)),
    }))

    ctx.rpc.register(defineRpcFunction({
      name: 'nmi:get-packages-npm-meta',
      type: 'query',
      handler: async (specs: string[]) => structuredCloneStringify(await handlers.getPackagesNpmMeta(specs)),
    }))

    ctx.rpc.register(defineRpcFunction({
      name: 'nmi:get-packages-npm-meta-latest',
      type: 'query',
      handler: async (pkgNames: string[]) => structuredCloneStringify(await handlers.getPackagesNpmMetaLatest(pkgNames)),
    }))

    ctx.rpc.register(defineRpcFunction({
      name: 'nmi:get-publint',
      type: 'query',
      handler: handlers.getPublint,
    }))

    ctx.rpc.register(defineRpcFunction({
      name: 'nmi:open-in-editor',
      type: 'event',
      handler: (filename: string) => handlers.openInEditor(filename),
    }))

    ctx.rpc.register(defineRpcFunction({
      name: 'nmi:open-in-finder',
      type: 'event',
      handler: (filename: string) => handlers.openInFinder(filename),
    }))
  },
})

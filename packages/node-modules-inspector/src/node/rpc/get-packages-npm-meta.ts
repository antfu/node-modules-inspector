import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'

export function getPackagesNpmMetaRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:get-packages-npm-meta',
    type: 'query',
    handler: (specs: string[]) => handlers.getPackagesNpmMeta(specs),
  })
}

import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'

export function getPayloadRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:get-payload',
    type: 'query',
    snapshot: true,
    handler: (force?: boolean) => handlers.getPayload(force),
  })
}

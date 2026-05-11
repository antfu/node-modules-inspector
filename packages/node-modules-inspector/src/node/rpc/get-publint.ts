import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'

export function getPublintRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:get-publint',
    type: 'query',
    handler: handlers.getPublint,
  })
}

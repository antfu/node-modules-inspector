import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'

export function openInFinderRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:open-in-finder',
    type: 'event',
    handler: (filename: string) => handlers.openInFinder(filename),
  })
}

import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'

export function openInEditorRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:open-in-editor',
    type: 'event',
    handler: (filename: string) => handlers.openInEditor(filename),
  })
}

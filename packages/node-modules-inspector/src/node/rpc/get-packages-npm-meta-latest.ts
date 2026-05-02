import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'

export function getPackagesNpmMetaLatestRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:get-packages-npm-meta-latest',
    type: 'query',
    handler: (pkgNames: string[]) => handlers.getPackagesNpmMetaLatest(pkgNames),
  })
}

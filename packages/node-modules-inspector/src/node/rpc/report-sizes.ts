import type { InspectorRpcHandlers } from './handlers'
import { defineRpcFunction } from 'devframe'
import * as v from 'valibot'
import { computeInstallSizes } from '../../shared/reports/sizes'

const argsSchema = v.optional(v.object({
  limit: v.optional(v.pipe(v.number(), v.integer()), 50),
  includeWorkspace: v.optional(v.boolean(), false),
}), {})

const returnsSchema = v.array(v.object({
  spec: v.string(),
  name: v.string(),
  version: v.string(),
  workspace: v.boolean(),
  bytes: v.number(),
  categories: v.record(v.string(), v.object({
    bytes: v.number(),
    count: v.number(),
  })),
}))

export function reportSizesRpc(handlers: InspectorRpcHandlers) {
  return defineRpcFunction({
    name: 'nmi:report-sizes',
    type: 'query',
    jsonSerializable: true,
    args: [argsSchema],
    returns: returnsSchema,
    agent: {
      description: 'List packages sorted by install size (largest first). Read-only.',
    },
    handler: (async (opts = {}) => {
      const payload = await handlers.getPayload()
      return computeInstallSizes(payload.packages.values(), opts)
    }) as any,
  })
}

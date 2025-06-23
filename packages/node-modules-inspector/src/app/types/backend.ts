import type { Ref } from 'vue'
import type { NodeModulesInspectorPayload, ServerFunctions } from '../../shared/types'

export interface ReferencePayloadFunctions {
  getReferencePayload?: (hash?: string) => Promise<NodeModulesInspectorPayload>
  getReferencePayloadList?: () => Promise<{ hash: string, timestamp: number, note: string }[]>
  saveReferencePayload?: (payload: NodeModulesInspectorPayload, note: string) => Promise<void>
  removeReferencePayload?: (hash: string) => Promise<void>
}

export type Functions
  = & Partial<ServerFunctions>
    & Pick<ServerFunctions, 'getPayload'>
    & ReferencePayloadFunctions

export interface Backend {
  name: string
  status: Ref<'idle' | 'connecting' | 'connected' | 'error'>
  connectionError: Ref<unknown | undefined>
  connect: () => Promise<void> | void
  isDynamic?: boolean
  functions: Functions
}

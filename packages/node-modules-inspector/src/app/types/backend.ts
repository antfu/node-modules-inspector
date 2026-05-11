import type { NpmMeta, NpmMetaLatest, PackageNode, PublintMessage } from 'node-modules-tools'
import type { Ref } from 'vue'
import type { NodeModulesInspectorPayload } from '../../shared/types'

export interface ReferencePayloadFunctions {
  getReferencePayload?: (hash?: string) => Promise<NodeModulesInspectorPayload>
  getReferencePayloadList?: () => Promise<{ hash: string, timestamp: number, note: string }[]>
  saveReferencePayload?: (payload: NodeModulesInspectorPayload, note: string) => Promise<void>
  removeReferencePayload?: (hash: string) => Promise<void>
}

export interface BackendCallableFunctions {
  getPayload: (force?: boolean) => Promise<NodeModulesInspectorPayload>
  getPackagesNpmMeta?: (specs: string[]) => Promise<Map<string, NpmMeta | null>>
  getPackagesNpmMetaLatest?: (pkgNames: string[]) => Promise<Map<string, NpmMetaLatest | null>>
  getPublint?: (pkg: Pick<PackageNode, 'private' | 'workspace' | 'spec' | 'filepath'>) => Promise<PublintMessage[] | null>
  openInEditor?: (filename: string) => void
  openInFinder?: (filename: string) => void
}

export type Functions = BackendCallableFunctions & ReferencePayloadFunctions

export interface Backend {
  name: string
  status: Ref<'idle' | 'connecting' | 'connected' | 'error'>
  connectionError: Ref<unknown | undefined>
  connect: () => Promise<void> | void
  isDynamic?: boolean
  functions: Functions
}

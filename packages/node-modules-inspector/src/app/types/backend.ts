import type { Ref } from 'vue'
import type { ServerFunctions } from '~~/shared/types'

export interface Backend {
  name: string
  status: Ref<'idle' | 'connecting' | 'connected' | 'error'>
  connectionError: Ref<unknown | undefined>
  connect: () => Promise<void> | void
  isDynamic?: boolean
  functions: Partial<ServerFunctions> & Pick<ServerFunctions, 'listDependencies'>
}

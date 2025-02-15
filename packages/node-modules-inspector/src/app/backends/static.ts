import type { Backend } from '~/types/backend'
import { ref } from 'vue'

export function createStaticBackend(): Backend {
  return {
    name: 'static',
    status: ref('connected'),
    connectionError: ref(undefined),
    connect() {},
    functions: {
      getPayload: () => {
        throw new Error('Not implemented')
      },
    },
  }
}

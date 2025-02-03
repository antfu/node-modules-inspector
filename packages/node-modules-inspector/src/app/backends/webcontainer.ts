import type { Backend } from '~/types/backend'
import { ref } from 'vue'

export function createWebContainerBackend(): Backend {
  return {
    name: 'webcontainer',
    status: ref('idle'),
    connectionError: ref(undefined),
    connect() {},
    functions: {
      listDependencies: () => {
        throw new Error('Not implemented')
      },
    },
  }
}

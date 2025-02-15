import type { ServerFunctionsDump } from '~~/shared/types'
import type { Backend } from '~/types/backend'
import { parse } from 'structured-clone-es'
import { ref } from 'vue'

export function createStaticBackend(): Backend {
  const status: Backend['status'] = ref('connecting')
  const error = ref<Error | undefined>(undefined)
  const getDump = fetch('/api/rpc-dump.json')
    .then(res => res.text())
    .then(text => parse(text) as ServerFunctionsDump)
    .then((dump) => {
      status.value = 'connected'
      return dump
    })
    .catch((e) => {
      status.value = 'error'
      console.error('Failed to fetch RPC dump:', e)
      error.value = e
      throw e
    })

  return {
    name: 'static',
    status,
    connectionError: error,
    connect() {},
    functions: {
      getPayload: () => {
        return getDump.then(dump => dump.getPayload)
      },
    },
  }
}

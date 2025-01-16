import type { ClientFunctions, Metadata, ServerFunctions } from '~~/shared/types'
import { useDebounce } from '@vueuse/core'
import { createBirpc } from 'birpc'
import { parse, stringify } from 'flatted'
import { ref, shallowRef } from 'vue'

export const wsConnecting = ref(false)
export const wsError = shallowRef<any>()
export const wsConnectingDebounced = useDebounce(wsConnecting, 2000)

const connectPromise = connectWebSocket()
let onMessage: any = () => {}

export const clientFunctions = {} as ClientFunctions

export const rpc = createBirpc<ServerFunctions, ClientFunctions>(clientFunctions, {
  post: async (d) => {
    (await connectPromise).send(d)
  },
  on: (fn) => {
    onMessage = fn
  },
  serialize: stringify,
  deserialize: parse,
  onError(error, name) {
    console.error(`[node-modules-inspector] RPC error on executing "${name}":`, error)
  },
  timeout: 120_000,
})

async function connectWebSocket() {
  const metadata: Metadata = await $fetch('/api/metadata.json')

  const ws = new WebSocket(
    `${location.protocol.replace('http', 'ws')}//${location.hostname}:${metadata.websocket}`,
  )

  ws.addEventListener('close', () => {
    wsConnecting.value = true
  })
  ws.addEventListener('open', () => {
    wsConnecting.value = false
  })
  ws.addEventListener('error', (e) => {
    wsError.value = e
  })
  ws.addEventListener('message', (e) => {
    wsConnecting.value = false
    onMessage(e.data)
  })

  wsConnecting.value = true

  return ws
}

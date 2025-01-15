/* eslint-disable no-console */
import type { ErrorInfo, Payload, ResolvedPayload } from '~~/shared/types'
import { $fetch } from 'ofetch'
import { computed, ref } from 'vue'

const LOG_NAME = '[Node Modules Inspector]'

const data = ref<Payload>({
  meta: {} as any,
})

/**
 * State of initial loading
 */
export const isLoading = ref(true)
/**
 * State of fetching, used for loading indicator
 */
export const isFetching = ref(false)
/**
 * Error information
 */
export const errorInfo = ref<ErrorInfo>()

function isErrorInfo(payload: Payload | ErrorInfo): payload is ErrorInfo {
  return 'error' in payload
}

async function get(baseURL: string) {
  isFetching.value = true
  const payload = await $fetch<Payload | ErrorInfo>('/api/payload.json', { baseURL })
  if (isErrorInfo(payload)) {
    errorInfo.value = payload
    isLoading.value = false
    isFetching.value = false
    return
  }
  errorInfo.value = undefined
  data.value = payload
  isLoading.value = false
  isFetching.value = false
  console.log(LOG_NAME, 'Payload', payload)
  return payload
}

let _promise: Promise<Payload | undefined> | undefined

export function init(baseURL: string) {
  if (_promise)
    return
  _promise = get(baseURL)
    .then((payload) => {
      if (!payload)
        return

      if (typeof payload.meta.wsPort === 'number') {
      // Connect to WebSocket, listen for config changes
        const ws = new WebSocket(`ws://${location.hostname}:${payload.meta.wsPort}`)
        ws.addEventListener('message', async (event) => {
          console.log(LOG_NAME, 'WebSocket message', event.data)
          const payload = JSON.parse(event.data)
          if (payload.type === 'config-change')
            get(baseURL)
        })
        ws.addEventListener('open', () => {
          console.log(LOG_NAME, 'WebSocket connected')
        })
        ws.addEventListener('close', () => {
          console.log(LOG_NAME, 'WebSocket closed')
        })
        ws.addEventListener('error', (error) => {
          console.error(LOG_NAME, 'WebSocket error', error)
        })
      }

      return payload
    })
}

export function ensureDataFetch() {
  return _promise
}

export const payload = computed(() => Object.freeze(resolvePayload(data.value!)))

export function resolvePayload(payload: Payload): ResolvedPayload {
  return {
    ...payload,
  }
}

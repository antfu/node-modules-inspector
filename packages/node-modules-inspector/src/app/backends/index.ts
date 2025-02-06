import type { Backend } from '~/types/backend'
import { shallowRef } from 'vue'

const backend = shallowRef<Backend>()
let backendPromise: Promise<Backend>

// TODO: support other backends
export function createBackend() {
  if (!backendPromise) {
    backendPromise = (import.meta.env.BACKEND === 'webcontainer'
      ? import('../webcontainer/backend').then(m => m.createWebContainerBackend())
      : import('./websocket').then(m => m.createWebSocketBackend()))
      .then((b) => {
        backend.value = b
        return b
      })
  }
  return backendPromise
}

export function ensureBackend() {
  return backendPromise
}

export function getBackend() {
  return backend
}

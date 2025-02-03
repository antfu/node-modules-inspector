import { createWebSocketBackend } from './websocket'

// TODO: support other backends
const backend = createWebSocketBackend()

export function getBackend() {
  return backend
}

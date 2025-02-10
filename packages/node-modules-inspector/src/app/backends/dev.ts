import type { ConnectionMeta } from '~~/shared/types'
import { createWebSocketBackend } from './websocket'

export async function createDevBackend() {
  const metadata: ConnectionMeta = await $fetch('/api/metadata.json') as any
  const url = `${location.protocol.replace('http', 'ws')}//${location.hostname}:${metadata.websocket}`

  return createWebSocketBackend({
    name: 'dev',
    websocketUrl: url,
  })
}

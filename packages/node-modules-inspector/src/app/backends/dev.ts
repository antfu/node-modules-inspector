import type { ConnectionMeta } from '../../shared/types'
import { createStaticBackend } from './static'
import { createWebSocketBackend } from './websocket'

export async function createDevBackend() {
  const metadata: ConnectionMeta = await fetch('api/metadata.json')
    .then(r => r.json())

  if (metadata.backend === 'static') {
    return createStaticBackend()
  }
  else {
    const url = `${location.protocol.replace('http', 'ws')}//${location.hostname}:${metadata.websocket}`

    return createWebSocketBackend({
      name: 'dev',
      websocketUrl: url,
    })
  }
}

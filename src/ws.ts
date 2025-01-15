import type { WebSocket } from 'ws'
import type { Payload } from '~~/shared/types'
import chokidar from 'chokidar'
import { getPort } from 'get-port-please'
import { WebSocketServer } from 'ws'
import { MARK_CHECK } from './constants'

export interface CreateWsServerOptions {
  root: string
}

export async function createWsServer(options: CreateWsServerOptions) {
  let payload: Payload | undefined
  const port = await getPort({ port: 7811, random: true })
  const wss = new WebSocketServer({
    port,
  })
  const wsClients = new Set<WebSocket>()

  wss.on('connection', (ws) => {
    wsClients.add(ws)
    console.log(MARK_CHECK, 'Websocket client connected')
    ws.on('close', () => wsClients.delete(ws))
  })

  const watcher = chokidar.watch([], {
    ignoreInitial: true,
    cwd: options.root,
  })

  watcher.on('change', (path) => {
    payload = undefined
    console.log()
    console.log(MARK_CHECK, 'Config change detected', path)
    wsClients.forEach((ws) => {
      ws.send(JSON.stringify({
        type: 'config-change',
        path,
      }))
    })
  })

  async function getData() {
    return payload
  }

  return {
    port,
    wss,
    watcher,
    getData,
  }
}

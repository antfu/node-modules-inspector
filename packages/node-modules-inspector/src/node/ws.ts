import type { ChannelOptions } from 'birpc'
import type { ListPackageDependenciesOptions } from 'node-modules-tools'
import type { WebSocket } from 'ws'
import type { ConnectionMeta } from '../shared/types'
import { createBirpcGroup } from 'birpc'
import { getPort } from 'get-port-please'
import c from 'picocolors'
import { parse, stringify } from 'structured-clone-es'
import { WebSocketServer } from 'ws'
import { MARK_CHECK } from './constants'
import { createServerFunctions } from './rpc'

export interface CreateWsServerOptions extends Partial<ListPackageDependenciesOptions> {
  cwd: string
}

export async function createWsServer(options: CreateWsServerOptions) {
  const port = await getPort({ port: 7812, random: true })
  const wss = new WebSocketServer({
    port,
  })
  const wsClients = new Set<WebSocket>()

  const serverFunctions = createServerFunctions(options)
  const rpc = createBirpcGroup(
    serverFunctions,
    [],
    {
      onError(error, name) {
        console.error(c.yellow(`[node-modules-inspector] RPC error on executing "${c.bold(name)}":`))
        console.error(error)
        throw error
      },
      timeout: 120_000,
    },
  )

  wss.on('connection', (ws) => {
    wsClients.add(ws)
    const channel: ChannelOptions = {
      post: d => ws.send(d),
      on: (fn) => {
        ws.on('message', (data) => {
          fn(data)
        })
      },
      serialize: stringify,
      deserialize: parse,
    }
    rpc.updateChannels((c) => {
      c.push(channel)
    })
    ws.on('close', () => {
      wsClients.delete(ws)
      rpc.updateChannels((c) => {
        const index = c.indexOf(channel)
        if (index >= 0)
          c.splice(index, 1)
      })
    })

    console.log(MARK_CHECK, 'Websocket client connected')
  })

  const getMetadata = async (): Promise<ConnectionMeta> => {
    return {
      websocket: port,
    }
  }

  return {
    port,
    wss,
    getMetadata,
  }
}

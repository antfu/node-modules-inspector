import type { ChannelOptions } from 'birpc'
import type { WebSocket } from 'ws'
import type { ConnectionMeta } from '../shared/types'
import type { CreateServerFunctionsOptions } from './rpc'
import c from 'ansis'
import { createBirpcGroup } from 'birpc'
import { getPort } from 'get-port-please'
import { parse, stringify } from 'structured-clone-es'
import { WebSocketServer } from 'ws'
import { MARK_CHECK } from './constants'
import { createServerFunctions } from './rpc'

export interface CreateWsServerOptions extends CreateServerFunctionsOptions {
  cwd: string
  port?: number
}

export async function createWsServer(options: CreateWsServerOptions) {
  const port = options.port ?? await getPort({ port: 7812, random: true })
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
        console.error(c.red`⬢ RPC error on executing "${c.bold(name)}":`)
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

    console.log(c.green`${MARK_CHECK} Websocket client connected`)
  })

  const getMetadata = async (): Promise<ConnectionMeta> => {
    return {
      backend: 'websocket',
      websocket: port,
    }
  }

  return {
    port,
    wss,
    rpc,
    serverFunctions,
    getMetadata,
  }
}

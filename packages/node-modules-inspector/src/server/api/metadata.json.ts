import process from 'node:process'
import { consola } from 'consola'
import { createH3DevToolsHost, createHostContext, startHttpAndWs } from 'devframe/node'
import { getPort } from 'get-port-please'
import devtool from '../../node/devtool'

consola.restoreAll()

let _serverPromise: Promise<{ port: number, jsonSerializableMethods: string[] }> | null = null

async function bootDevtoolServer() {
  const port = await getPort({ port: 7812, random: true })

  const ctx = await createHostContext({
    cwd: process.cwd(),
    mode: 'dev',
    host: createH3DevToolsHost({ origin: `http://localhost:${port}`, appName: devtool.id }),
  })
  await devtool.setup(ctx, { flags: {} })

  await startHttpAndWs({
    context: ctx,
    host: 'localhost',
    port,
    auth: false,
  })

  // Warm up the payload so the first SPA call doesn't block on a cold read.
  setTimeout(() => {
    const invoke = ctx.rpc.invokeLocal as (method: string, ...args: any[]) => Promise<any>
    invoke('nmi:get-payload').catch(() => {})
  }, 1)

  const jsonSerializableMethods: string[] = []
  for (const def of ctx.rpc.definitions.values()) {
    if (def.jsonSerializable === true)
      jsonSerializableMethods.push(def.name)
  }

  return { port, jsonSerializableMethods }
}

function getServer() {
  if (!_serverPromise)
    _serverPromise = bootDevtoolServer()
  return _serverPromise
}

export default eventHandler(async () => {
  const { port, jsonSerializableMethods } = await getServer()
  return { backend: 'websocket', websocket: port, jsonSerializableMethods }
})

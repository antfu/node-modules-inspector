import process from 'node:process'
import { consola } from 'consola'
import { createH3DevframeHost, createHostContext, startHttpAndWs } from 'devframe/node'
import { getRandomPort } from 'get-port-please'
import devframe from '../../node/devframe'

consola.restoreAll()

let _serverPromise: Promise<{ port: number, jsonSerializableMethods: string[] }> | null = null

async function bootDevframeServer() {
  // Always pick a random free port for the dev-time RPC server. The client discovers it via
  // this metadata endpoint, so there's no benefit to a fixed default — and a fixed default
  // would clash with sibling workspaces running the inspector in parallel.
  const port = await getRandomPort('localhost')

  const ctx = await createHostContext({
    cwd: process.cwd(),
    mode: 'dev',
    host: createH3DevframeHost({ origin: `http://localhost:${port}`, appName: devframe.id }),
  })
  await devframe.setup(ctx, { flags: {} })

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
    _serverPromise = bootDevframeServer()
  return _serverPromise
}

export default eventHandler(async () => {
  const { port, jsonSerializableMethods } = await getServer()
  return { backend: 'websocket', websocket: port, jsonSerializableMethods }
})

import type { ConnectionMeta } from 'devframe/types'
import { consola } from 'consola'
import { initDevframe } from 'devframe/initiate'
import { defineEventHandler } from 'h3'
import devframe from '../../node/devframe'

consola.restoreAll()

let _instancePromise: Promise<ConnectionMeta> | null = null

async function bootDevframeServer() {
  // Nitro request handlers can't accept WebSocket upgrades, so run the RPC
  // socket on an auto-port side-car. `initDevframe` advertises the resolved
  // port in the connection meta below, and the SPA discovers it via this
  // endpoint — no manual host/context/server wiring or port picking needed.
  const instance = initDevframe(devframe, {
    base: `/__${devframe.id}/`,
    // Bridge mode: the SPA is served by Nitro; devframe only owns the socket.
    distDir: false,
    ws: { sidecar: true },
    sse: false,
    auth: false,
    flags: {},
  })

  await instance.ready

  // Warm up the payload so the first SPA call doesn't block on a cold read.
  const ctx = await instance.context
  const invoke = ctx.rpc.invokeLocal as (method: string, ...args: any[]) => Promise<any>
  setTimeout(() => {
    invoke('nmi:get-payload').catch(() => {})
  }, 1)

  // `connectionMeta()` runs in bridge mode (no served __connection.json), so it
  // doesn't enumerate `jsonSerializableMethods`. Advertise them for wire-format
  // parity with the static build and the CLI dev server.
  const jsonSerializableMethods: string[] = []
  for (const def of ctx.rpc.definitions.values()) {
    if (def.jsonSerializable === true)
      jsonSerializableMethods.push(def.name)
  }

  return { ...instance.connectionMeta(), jsonSerializableMethods }
}

function getServer() {
  if (!_instancePromise)
    _instancePromise = bootDevframeServer()
  return _instancePromise
}

export default defineEventHandler(async () => {
  return getServer()
})

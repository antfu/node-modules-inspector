import process from 'node:process'
import { consola } from 'consola'
import { storageNpmMeta, storagePublint } from '../../../node/storage'
import { createWsServer } from '../../../node/ws'

consola.restoreAll()

const ws = createWsServer({
  cwd: process.cwd(),
  storageNpmMeta,
  storagePublint,
  mode: 'dev',
}).then((ws) => {
  // Warm up the payload
  setTimeout(() => {
    ws.serverFunctions.getPayload()
  }, 1)
  return ws
})

export default eventHandler(async () => {
  return await (await ws).getMetadata()
})

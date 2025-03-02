import process from 'node:process'
import { consola } from 'consola'
import { storagePublishDates } from '~~/node/storage'
import { createWsServer } from '~~/node/ws'

consola.restoreAll()

export default lazyEventHandler(async () => {
  const ws = await createWsServer({
    cwd: process.cwd(),
    storagePublishDates,
    mode: 'dev',
  })

  return defineEventHandler(async () => {
    return await ws.getMetadata()
  })
})

import process from 'node:process'
import { createWsServer } from '~~/node/ws'

export default lazyEventHandler(async () => {
  const ws = await createWsServer({
    root: process.cwd(),
  })

  return defineEventHandler(async () => {
    return await ws.getMetadata()
  })
})

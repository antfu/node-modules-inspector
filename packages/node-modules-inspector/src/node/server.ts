import type { Buffer } from 'node:buffer'
import type { CreateWsServerOptions } from './ws'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createApp, eventHandler, serveStatic, toNodeListener } from 'h3'
import { lookup } from 'mrmime'
import { join } from 'pathe'
import { distDir } from '../dirs'
import { createWsServer } from './ws'

export async function createHostServer(options: CreateWsServerOptions) {
  const app = createApp()

  const ws = await createWsServer(options)

  const fileMap = new Map<string, Promise<string | Buffer<ArrayBufferLike> | undefined>>()
  const readCachedFile = (id: string) => {
    if (!fileMap.has(id))
      fileMap.set(id, readFile(id).catch(() => undefined))
    return fileMap.get(id)
  }

  app.use('/api/metadata.json', eventHandler(async (event) => {
    event.node.res.setHeader('Content-Type', 'application/json')
    return event.node.res.end(JSON.stringify(await ws.getMetadata()))
  }))

  app.use('/', eventHandler(async (event) => {
    const result = await serveStatic(event, {
      fallthrough: true,
      getContents: id => readCachedFile(join(distDir, id)),
      getMeta: async (id) => {
        const stats = await stat(join(distDir, id)).catch(() => {})
        if (!stats || !stats.isFile())
          return
        return {
          type: lookup(id),
          size: stats.size,
          mtime: stats.mtimeMs,
        }
      },
    })

    if (result === false)
      return readCachedFile(join(distDir, 'index.html'))
  }))

  return {
    server: createServer(toNodeListener(app)),
    ws,
  }
}

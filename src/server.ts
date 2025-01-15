import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { createApp, eventHandler, serveStatic, toNodeListener } from 'h3'
import { lookup } from 'mrmime'
import { distDir } from './dirs'
import { createWsServer, type CreateWsServerOptions } from './ws'

export async function createHostServer(options: CreateWsServerOptions) {
  const app = createApp()

  const ws = await createWsServer(options)

  const fileMap = new Map<string, Promise<string | undefined>>()
  const readCachedFile = (id: string) => {
    if (!fileMap.has(id))
      fileMap.set(id, readFile(id, 'utf-8').catch(() => undefined))
    return fileMap.get(id)
  }

  app.use('/api/payload.json', eventHandler(async (event) => {
    event.node.res.setHeader('Content-Type', 'application/json')
    return event.node.res.end(JSON.stringify(await ws.getData()))
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

  return createServer(toNodeListener(app))
}

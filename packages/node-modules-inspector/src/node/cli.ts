import type { ServerFunctionsDump } from '~~/shared/types'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import process from 'node:process'

import cac from 'cac'
import fg from 'fast-glob'
import { getPort } from 'get-port-please'
import open from 'open'
import { relative, resolve } from 'pathe'
import c from 'picocolors'
import { stringify } from 'structured-clone-es'
import { distDir } from '../dirs'
import { MARK_CHECK, MARK_INFO } from './constants'
import { createHostServer } from './server'
import { storagePublishDates } from './storage'

const cli = cac('node-modules-inspector')

cli
  .command('build', 'Build inspector with current config file for static hosting')
  .option('--root <root>', 'Root directory', { default: process.cwd() })
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 25 })
  // Build specific options
  .option('--base <baseURL>', 'Base URL for deployment', { default: '/' })
  .option('--outDir <dir>', 'Output directory', { default: '.node-modules-inspector' })
  // Action
  .action(async (options) => {
    console.log(MARK_INFO, 'Building static Node Modules Inspector...')

    const cwd = process.cwd()
    const outDir = resolve(cwd, options.outDir)

    const rpc = await import('./rpc').then(r => r.createServerFunctions({
      cwd,
      depth: options.depth,
      storagePublishDates,
      mode: 'build',
    }))
    const rpcDump: ServerFunctionsDump = {
      getPayload: await rpc.getPayload(),
      // TODO: Implement this
      getPackagesPublishDate: new Map(),
    }

    let baseURL = options.base
    if (!baseURL.endsWith('/'))
      baseURL += '/'
    if (!baseURL.startsWith('/'))
      baseURL = `/${baseURL}`
    baseURL = baseURL.replace(/\/+/g, '/')

    if (existsSync(outDir))
      await fs.rm(outDir, { recursive: true })
    await fs.mkdir(outDir, { recursive: true })
    await fs.cp(distDir, outDir, { recursive: true })
    const htmlFiles = await fg('**/*.html', { cwd: distDir, onlyFiles: true })
    // Rewrite HTML files with base URL
    if (baseURL !== '/') {
      for (const file of htmlFiles) {
        const content = await fs.readFile(resolve(distDir, file), 'utf-8')
        const newContent = content
          .replaceAll(/\s(href|src)="\//g, ` $1="${baseURL}`)
          .replaceAll('baseURL:"/"', `baseURL:"${baseURL}"`)
        await fs.writeFile(resolve(outDir, file), newContent, 'utf-8')
      }
    }

    await fs.mkdir(resolve(outDir, 'api'), { recursive: true })
    await fs.writeFile(resolve(outDir, 'api/metadata.json'), JSON.stringify({ backend: 'static' }, null, 2), 'utf-8')
    await fs.writeFile(resolve(outDir, 'api/rpc-dump.json'), stringify(rpcDump), 'utf-8')

    console.log(MARK_CHECK, `Built to ${relative(cwd, outDir)}`)
    console.log(MARK_INFO, `You can use static server like \`npx serve ${relative(cwd, outDir)}\` to serve the inspector`)
  })

cli
  .command('', 'Start dev inspector')
  .option('--root <root>', 'Root directory', { default: process.cwd() })
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 25 })
  // Dev specific options
  .option('--host <host>', 'Host', { default: process.env.HOST || '127.0.0.1' })
  .option('--port <port>', 'Port', { default: process.env.PORT || 9999 })
  .option('--open', 'Open browser', { default: true })
  // Action
  .action(async (options) => {
    const host = options.host
    const port = await getPort({ port: options.port, portRange: [9999, 15000], host })

    console.log(MARK_INFO, `Starting Node Modules Inspector at`, c.green(`http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`), '\n')

    const server = await createHostServer({
      cwd: options.root,
      depth: options.depth,
      storagePublishDates,
      mode: 'dev',
    })

    server.listen(port, host, async () => {
      if (options.open)
        await open(`http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`)
    })
  })

cli.help()
cli.parse()

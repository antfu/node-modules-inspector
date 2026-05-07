import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import process from 'node:process'

import c from 'ansis'
import cac from 'cac'
import { createDevServer, resolveDevServerPort } from 'devframe/adapters/dev'
import {
  DEVTOOLS_CONNECTION_META_FILENAME,
  DEVTOOLS_RPC_DUMP_DIRNAME,
  DEVTOOLS_RPC_DUMP_MANIFEST_FILENAME,
} from 'devframe/constants'
import {
  collectStaticRpcDump,
  createH3DevToolsHost,
  createHostContext,
} from 'devframe/node'
import { strictJsonStringify, structuredCloneStringify } from 'devframe/rpc'
import { dirname, relative, resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { distDir } from '../dirs'
import { MARK_CHECK, MARK_NODE } from './constants'
import devtool from './devtool'

const cli = cac('node-modules-inspector')

cli
  .command('build', 'Build inspector with current config file for static hosting')
  .option('--root <root>', 'Root directory', { default: process.cwd() })
  .option('--config <config>', 'Config file')
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 8 })
  .option('--base <baseURL>', 'Base URL for deployment', { default: '/' })
  .option('--outDir <dir>', 'Output directory', { default: '.node-modules-inspector' })
  .action(async (options) => {
    console.log(c.cyan`${MARK_NODE} Building static Node Modules Inspector...`)

    const cwd = options.root
    const outDir = resolve(cwd, options.outDir)

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

    const ctx = await createHostContext({
      cwd,
      mode: 'build',
      host: createH3DevToolsHost({ origin: 'http://localhost' }),
    })
    await devtool.setup(ctx, {
      flags: {
        root: cwd,
        config: options.config,
        depth: Number(options.depth),
      },
    })

    await fs.mkdir(resolve(outDir, DEVTOOLS_RPC_DUMP_DIRNAME), { recursive: true })

    const jsonSerializableMethods: string[] = []
    for (const def of ctx.rpc.definitions.values()) {
      if (def.jsonSerializable === true)
        jsonSerializableMethods.push(def.name)
    }
    await fs.writeFile(
      resolve(outDir, DEVTOOLS_CONNECTION_META_FILENAME),
      JSON.stringify({ backend: 'static', jsonSerializableMethods }, null, 2),
      'utf-8',
    )

    const dump = await collectStaticRpcDump(ctx.rpc.definitions.values(), ctx)
    for (const [filepath, file] of Object.entries(dump.files)) {
      const fullpath = resolve(outDir, filepath)
      await fs.mkdir(dirname(fullpath), { recursive: true })
      const text = file.serialization === 'structured-clone'
        ? structuredCloneStringify(file.data)
        : strictJsonStringify(file.data, file.fnName)
      await fs.writeFile(fullpath, text, 'utf-8')
    }
    await fs.writeFile(
      resolve(outDir, DEVTOOLS_RPC_DUMP_MANIFEST_FILENAME),
      JSON.stringify(dump.manifest, null, 2),
      'utf-8',
    )

    if (baseURL !== '/') {
      const htmlFiles = await glob('**/*.html', { cwd: outDir, onlyFiles: true, dot: true, expandDirectories: false })
      for (const file of htmlFiles) {
        const filePath = resolve(outDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const newContent = content
          .replaceAll(/\s(href|src)="\//g, ` $1="${baseURL}`)
          .replaceAll('baseURL:"/"', `baseURL:"${baseURL}"`)
        await fs.writeFile(filePath, newContent, 'utf-8')
      }
    }

    console.log(c.green`${MARK_CHECK} Built to ${relative(cwd, outDir)}`)
    console.log(c.blue`${MARK_NODE} You can use static server like \`npx serve ${relative(cwd, outDir)}\` to serve the inspector`)
  })

cli
  .command('', 'Start dev inspector')
  .option('--root <root>', 'Root directory', { default: process.cwd() })
  .option('--config <config>', 'Config file')
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 8 })
  .option('--host <host>', 'Host', { default: process.env.HOST || '127.0.0.1' })
  .option('--port <port>', 'Port', { default: process.env.PORT || 9999 })
  .option('--open', 'Open browser', { default: true })
  .action(async (options) => {
    const host = options.host
    const port = await resolveDevServerPort(devtool, {
      host,
      defaultPort: Number(options.port),
    })
    const url = `http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`

    console.log(c.green`${MARK_NODE} Starting Node Modules Inspector at`, c.green(url), '\n')

    const server = await createDevServer(devtool, {
      host,
      port,
      flags: {
        root: options.root,
        config: options.config,
        depth: Number(options.depth),
      },
      openBrowser: options.open ? url : false,
    })

    // Warm the payload; rpcGroup.functions is a Proxy returning Promise<handler>.
    const handlers = server.rpcGroup.functions as Record<string, Promise<(...args: unknown[]) => unknown> | undefined>
    handlers['nmi:get-payload']?.then(fn => fn?.()).catch(() => {})
  })

cli.help()
cli.parse()

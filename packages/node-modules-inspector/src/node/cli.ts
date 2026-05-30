import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import process from 'node:process'

import c from 'ansis'
import cac from 'cac'
import { createDevServer, resolveDevServerPort } from 'devframe/adapters/dev'
import {
  DEVFRAME_CONNECTION_META_FILENAME,
  DEVFRAME_RPC_DUMP_DIRNAME,
  DEVFRAME_RPC_DUMP_MANIFEST_FILENAME,
} from 'devframe/constants'
import { createH3DevframeHost, createHostContext } from 'devframe/node'
import { strictJsonStringify } from 'devframe/rpc'
import { collectStaticRpcDump } from 'devframe/rpc/dump'
import { structuredCloneStringify } from 'devframe/utils/structured-clone'
import { dirname, relative, resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { distDir } from '../dirs'
import { MARK_CHECK, MARK_NODE } from './constants'
import devframe from './devframe'

const cli = cac('node-modules-inspector')

cli
  .command('build', 'Build inspector with current config file for static hosting')
  .option('--root <root>', 'Root directory', { default: process.cwd() })
  .option('--config <config>', 'Config file')
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 8 })
  .option('--base <baseURL>', 'Base URL for deployment', { default: '/' })
  .option('--outDir <dir>', 'Output directory', { default: 'dist/__node-modules-inspector' })
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
      host: createH3DevframeHost({ origin: 'http://localhost', appName: devframe.id }),
    })
    await devframe.setup(ctx, {
      flags: {
        root: cwd,
        config: options.config,
        depth: Number(options.depth),
      },
    })

    await fs.mkdir(resolve(outDir, DEVFRAME_RPC_DUMP_DIRNAME), { recursive: true })

    const jsonSerializableMethods: string[] = []
    for (const def of ctx.rpc.definitions.values()) {
      if (def.jsonSerializable === true)
        jsonSerializableMethods.push(def.name)
    }
    await fs.writeFile(
      resolve(outDir, DEVFRAME_CONNECTION_META_FILENAME),
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
      resolve(outDir, DEVFRAME_RPC_DUMP_MANIFEST_FILENAME),
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
          // Nuxt's <script type="importmap"> entries and buildAssetsDir live in
          // JSON / object literals — quoted absolute /_nuxt/* paths the
          // attribute regex above doesn't reach. Without this the importmap
          // points the entry chunk at /_nuxt/* under the deploy origin and the
          // SPA fails to hydrate at the sub-base.
          .replaceAll('"/_nuxt/', `"${baseURL}_nuxt/`)
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
    const port = await resolveDevServerPort(devframe, {
      host,
      defaultPort: Number(options.port),
    })
    const url = `http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`

    console.log(c.green`${MARK_NODE} Starting Node Modules Inspector at`, c.green(url), '\n')

    const server = await createDevServer(devframe, {
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
    const handlers = server.rpcGroup.functions as unknown as Record<string, Promise<(...args: unknown[]) => unknown> | undefined>
    handlers['nmi:get-payload']?.then(fn => fn?.()).catch(() => {})
  })

cli
  .command('check', 'Run analysis and config hook without starting the server (for CI/CD)')
  .option('--root <dir>', 'Root directory', { default: process.cwd() })
  .option('--config <file>', 'Config file')
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 8 })
  .action(async (options) => {
    const { createInspectorRpcHandlers } = await import('./rpc/handlers')
    const { storageNpmMeta, storageNpmMetaLatest, storagePublint } = await import('./storage')

    const handlers = createInspectorRpcHandlers({
      cwd: options.root,
      depth: Number(options.depth),
      configFile: options.config,
      mode: 'build',
      storageNpmMeta,
      storageNpmMetaLatest,
      storagePublint,
    })

    try {
      await handlers.getPayload()
    }
    catch (error: any) {
      console.error(c.red`✖ ${error.message || error}`)
      process.exit(1)
    }
  })

cli
  .command('report <type>', 'Run an inspector report (maintainers | duplicates | sizes)')
  .option('--root <dir>', 'Root directory', { default: process.cwd() })
  .option('--config <file>', 'Config file')
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 8 })
  .option('--json', 'Emit JSON to stdout (machine-readable)')
  .option('--limit <n>', 'Cap the number of returned entries')
  .option('--sort <mode>', '[maintainers] Sort mode: depth | migration | latest', { default: 'depth' })
  .option('--author <handle>', '[maintainers] Filter by author handle (repeatable)')
  .option('--no-publint', '[maintainers] Exclude publint actions')
  .option('--no-latest-only', '[maintainers] Include consumers that are not on the latest major')
  .option('--min-versions <n>', '[duplicates] Only include packages installed at this many versions or more', { default: 2 })
  .option('--include-workspace', '[sizes] Include workspace packages')
  .action(async (type: string, options: Record<string, any>) => {
    const valid = ['maintainers', 'duplicates', 'sizes']
    if (!valid.includes(type)) {
      console.error(c.red`✖ Unknown report type "${type}". Expected one of: ${valid.join(', ')}.`)
      process.exit(1)
    }
    const { runReport } = await import('./cli-report/run-report')
    const authors = Array.isArray(options.author)
      ? options.author
      : options.author
        ? [options.author]
        : []
    await runReport({
      type: type as 'maintainers' | 'duplicates' | 'sizes',
      root: options.root,
      config: options.config,
      depth: Number(options.depth),
      json: !!options.json,
      limit: options.limit != null ? Number(options.limit) : undefined,
      sort: options.sort,
      authors,
      includePublint: options.publint !== false,
      latestOnly: options.latestOnly !== false,
      minVersions: options.minVersions != null ? Number(options.minVersions) : undefined,
      includeWorkspace: !!options.includeWorkspace,
    })
  })

cli
  .command('mcp', 'Start an MCP stdio server exposing report tools to coding agents (experimental)')
  .option('--root <dir>', 'Root directory', { default: process.cwd() })
  .option('--config <file>', 'Config file')
  .option('--depth <depth>', 'Max depth to list dependencies', { default: 8 })
  .action(async (options) => {
    if (options.config)
      process.env.NMI_CLI_CONFIG = options.config
    process.env.NMI_CLI_DEPTH = String(Number(options.depth))
    process.env.NMI_CLI_QUIET = '1'
    if (options.root && options.root !== process.cwd())
      process.chdir(options.root)

    const { createMcpServer } = await import('devframe/adapters/mcp')
    await createMcpServer(devframe, {
      transport: 'stdio',
      onReady: ({ transport }) => {
        console.error(c.green`${MARK_CHECK} ${devframe.id} MCP server ready (${transport})`)
      },
    })
  })

cli.help()
cli.parse()

import type { ListPackageDependenciesResult } from 'node-modules-tools'
import type { Backend } from '~/types/backend'
import { WebContainer } from '@webcontainer/api'
import c from 'chalk'
import { join } from 'pathe'
import { parse } from 'structured-clone-es'
import { createStorage } from 'unstorage'
import driverIndexedDb from 'unstorage/drivers/indexedb'
import { shallowRef } from 'vue'
import { WEBCONTAINER_STDOUT_PREFIX } from '~~/shared/constants'
import { getPackagesPublishDate } from '~~/shared/publish-date'
import { terminal } from '~/state/terminal'
import { CODE_PACKAGE_JSON, CODE_SERVER } from './constants'

let _promise: Promise<WebContainer> | null = null
const ROOT = '/app'

export function getContainer() {
  if (!_promise) {
    terminal.value?.writeln('')
    terminal.value?.writeln(c.gray('> Initiating WebContainer...'))
    _promise = WebContainer.boot()
      .then((wc) => {
        terminal.value?.writeln(c.gray('> WebContainer is booted.'))
        return wc
      })
      .catch((err) => {
        console.error(err)
        terminal.value?.writeln(c.red('> WebContainer failed to boot.'))
        throw err
      })
  }
  return _promise
}

export async function install(
  args: string[],
): Promise<Backend> {
  const wc = await getContainer()

  async function exec(
    cmd: string,
    args: string[],
    wait = true,
    onChunk?: (chunk: string) => void | boolean,
  ) {
    terminal.value?.writeln('')
    terminal.value?.writeln(c.gray(`> ${cmd} ${args.join(' ')}`))
    const process = await wc.spawn(cmd, args, { cwd: ROOT })

    process.output.pipeTo(new WritableStream({
      write(chunk) {
        if (onChunk?.(chunk) === false)
          return
        terminal.value?.write(chunk)
        terminal.value?.scrollToBottom()
      },
    }))

    if (wait)
      await process.exit

    return process
  }

  await wc.fs.rm(ROOT, { recursive: true, force: true })
  await wc.fs.mkdir(ROOT, { recursive: true })
  await wc.fs.writeFile(join(ROOT, 'package.json'), CODE_PACKAGE_JSON)
  await wc.fs.writeFile(join(ROOT, '__server.mjs'), CODE_SERVER)

  await exec('node', ['--version'])
  await exec('pnpm', ['--version'])

  await exec('pnpm', ['install', ...args])

  let result: ListPackageDependenciesResult | undefined
  const _process = exec('node', ['__server.mjs'], false, (chunk) => {
    if (chunk.startsWith(WEBCONTAINER_STDOUT_PREFIX)) {
      const data = chunk.slice(WEBCONTAINER_STDOUT_PREFIX.length)
      result = parse(data) as ListPackageDependenciesResult
      // eslint-disable-next-line no-console
      console.log('Data fetched', result)
      return false
    }
  })

  // WebContainer does not seems to support connecting to a websocket server direct
  // So here we have to temporarily use a restful server
  // const { port, url } = await new Promise<{ port: number, url: string }>((resolve, reject) => {
  //   wc.on('server-ready', (port, url) => {
  //     resolve({ port, url })
  //   })
  //   wc.on('error', (e) => {
  //     terminal?.value?.writeln('')
  //     terminal?.value?.writeln(c.red('> Failed to start server'))
  //     terminal?.value?.writeln(c.red(`> ${String(e)}`))
  //     console.error(e)
  //     reject(e)
  //   })
  // })

  // terminal.value?.writeln('')
  // terminal.value?.writeln(c.gray(`> Connecting to websocket ${websocket}`))
  // return createWebSocketBackend({
  //   name: 'webcontainer',
  //   websocketUrl: `${url.replace(/^http/, 'ws')}:${port}`
  // })

  const error = shallowRef<unknown | undefined>(undefined)
  const storage = createStorage<string>({
    driver: driverIndexedDb({
      base: 'nmi:publish-date',
    }),
  })

  return {
    name: 'webcontainer',
    connectionError: error,
    status: shallowRef('connected'),
    connect() {
      error.value = undefined
    },
    functions: {
      async listDependencies() {
        let retries = 50
        // eslint-disable-next-line no-unmodified-loop-condition
        while (!result && retries > 0) {
          retries--
          await new Promise(r => setTimeout(r, 100))
        }
        if (!result) {
          throw new Error('Failed to get dependencies')
        }
        return result
      },
      getPackagesPublishDate(deps) {
        return getPackagesPublishDate(deps, { storage })
      },
    },
  }
}

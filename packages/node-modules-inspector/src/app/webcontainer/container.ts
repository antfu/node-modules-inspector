import type { NpmMeta, NpmMetaLatest } from 'node-modules-tools'
import type { NodeModulesInspectorLog, NodeModulesInspectorPayload } from '../../shared/types'
import type { Backend } from '../types/backend'
import { WebContainer } from '@webcontainer/api'
import c from 'ansis'
import { join } from 'pathe'
import { parse } from 'structured-clone-es'
import { createStorage } from 'unstorage'
import driverIndexedDb from 'unstorage/drivers/indexedb'
import { shallowRef } from 'vue'
import { WEBCONTAINER_STDOUT_PREFIX } from '../../shared/constants'
import { getPackagesNpmMeta, getPackagesNpmMetaLatest } from '../../shared/version-info'
import { terminal } from '../state/terminal'
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

  let result: NodeModulesInspectorPayload | undefined
  let heartbeat = 0
  let serverError: any

  const _process = exec('node', ['__server.mjs'], false, (chunk) => {
    if (chunk.startsWith(WEBCONTAINER_STDOUT_PREFIX)) {
      const data = chunk.slice(WEBCONTAINER_STDOUT_PREFIX.length)
      const parsed = parse(data) as NodeModulesInspectorLog

      if ('status' in parsed) {
        if (parsed.status === 'heartbeat') {
          heartbeat = parsed.heartbeat
        }
        else if (parsed.status === 'error') {
          serverError = parsed.error
        }
      }
      else {
        result = parsed
        // eslint-disable-next-line no-console
        console.log('Data fetched', result)
      }
      return false
    }
  })

  const error = shallowRef<unknown | undefined>(undefined)
  const storageNpmMeta = createStorage<NpmMeta>({
    driver: driverIndexedDb({
      base: 'nmi:npm-meta',
    }),
  })
  const storageNpmMetaLatest = createStorage<NpmMetaLatest>({
    driver: driverIndexedDb({
      base: 'nmi:npm-meta-latest',
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
      async getPayload() {
        heartbeat = Date.now()
        serverError = undefined

        // Max 5000ms between heartbeat and now
        // eslint-disable-next-line no-unmodified-loop-condition
        while (!result && !serverError && Date.now() - heartbeat < 5000) {
          await new Promise(r => setTimeout(r, 100))
        }
        if (!result) {
          if (serverError)
            throw serverError

          throw new Error('Failed to get dependencies')
        }
        return result
      },
      getPackagesNpmMeta(deps) {
        return getPackagesNpmMeta(deps, { storageNpmMeta })
      },
      getPackagesNpmMetaLatest(pkgNames) {
        return getPackagesNpmMetaLatest(pkgNames, { storageNpmMetaLatest })
      },
    },
  }
}

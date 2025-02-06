import { WebContainer } from '@webcontainer/api'
import c from 'chalk'
import { join } from 'pathe'
import { createWebSocketBackend } from '~/backends/websocket'
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
) {
  const wc = await getContainer()

  async function exec(
    cmd: string,
    args: string[],
    wait = true,
  ) {
    terminal.value?.writeln('')
    terminal.value?.writeln(c.gray(`> ${cmd} ${args.join(' ')}`))
    const process = await wc.spawn(cmd, args, { cwd: ROOT })

    process.output.pipeTo(new WritableStream({
      write(chunk) {
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

  const _process = exec('node', ['__server.mjs'], false)

  const { port, url } = await new Promise<{ port: number, url: string }>((resolve, reject) => {
    wc.on('server-ready', (port, url) => {
      resolve({ port, url })
    })
    wc.on('error', (e) => {
      terminal?.value?.writeln('')
      terminal?.value?.writeln(c.red('> Failed to start server'))
      terminal?.value?.writeln(c.red(`> ${String(e)}`))
      console.error(e)
      reject(e)
    })
  })

  const websocket = `${url.replace(/^http/, 'ws')}:${port}`

  terminal.value?.writeln('')
  terminal.value?.writeln(c.gray(`> Connecting to websocket ${websocket}`))

  return createWebSocketBackend({
    name: 'webcontainer',
    websocketUrl: websocket,
  })
}

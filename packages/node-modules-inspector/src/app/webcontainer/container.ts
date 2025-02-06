import type { Terminal } from '@xterm/xterm'
import type { Metadata } from '~~/shared/types'
import { WebContainer } from '@webcontainer/api'
import c from 'chalk'
import { join } from 'pathe'
import { WEBCONTAINER_STDOUT_MARKER } from '~~/shared/constants'
import { CODE_PACKAGE_JSON, CODE_SERVER } from './constants'

let _promise: Promise<WebContainer> | null = null
const ROOT = '/app'

export function ready() {
  if (!_promise) {
    _promise = (async () => {
      const wc = await WebContainer.boot()
      await wc.mount({ app: { directory: {} } })

      return wc
    })()
  }
  return _promise
}

export async function install(
  terminal: Terminal,
  args: string[],
) {
  terminal.writeln('')
  terminal.writeln(c.gray('> Initiating WebContainer...'))

  const wc = await ready()

  let metadata: Metadata | undefined

  async function exec(
    cmd: string,
    args: string[],
    wait = true,
  ) {
    terminal.writeln('')
    terminal.writeln(c.gray(`> ${cmd} ${args.join(' ')}`))
    const process = await wc.spawn(cmd, args, { cwd: ROOT })

    process.output.pipeTo(new WritableStream({
      write(chunk) {
        terminal.write(chunk)
        terminal.scrollToBottom()

        let str = chunk.toString().trim()
        if (str.startsWith(WEBCONTAINER_STDOUT_MARKER)) {
          str = str.slice(WEBCONTAINER_STDOUT_MARKER.length)
          try {
            metadata = JSON.parse(str)
          }
          catch {}
        }
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

  const _process = await exec('node', ['__server.mjs'], false)

  let retries = 200

  // eslint-disable-next-line no-unmodified-loop-condition
  while (!metadata && retries > 0) {
    await new Promise(r => setTimeout(r, 200))
    retries--
  }
  if (!metadata) {
    terminal.writeln('')
    terminal.writeln(c.red('> Failed to start server'))
    return false
  }

  // eslint-disable-next-line no-console
  console.log(metadata)
}

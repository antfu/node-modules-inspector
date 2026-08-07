/* eslint-disable antfu/no-top-level-await */
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { x } from 'tinyexec'

const cwd = process.cwd()
const inspector = fileURLToPath(new URL('../../packages/node-modules-inspector', import.meta.url))

await x('pnpm', ['run', 'stub'], {
  nodeOptions: {
    cwd: inspector,
    stdio: 'inherit',
  },
})

await x('node', ['./bin.mjs', '--root', cwd], {
  nodeOptions: {
    cwd: inspector,
    stdio: 'inherit',
  },
})

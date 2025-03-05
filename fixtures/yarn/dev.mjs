/* eslint-disable antfu/no-top-level-await */
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { x } from 'tinyexec'

process.env.NMI_CWD = process.cwd()

await x('pnpm', ['run', 'dev'], {
  nodeOptions: {
    cwd: fileURLToPath(new URL('../../packages/node-modules-inspector', import.meta.url)),
    stdio: 'inherit',
    env: process.env,
  },
})

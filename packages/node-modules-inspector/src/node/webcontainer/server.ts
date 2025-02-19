/**
 * This is the entry point that we bundles with Rollup into a single file.
 *
 * The dist is located at `runtime/webcontainer-server.mjs` by `pnpm run wc:prepare`.
 *
 * The dist will be send to WebConainter to create the server to communicate with the main app.
 */

import process from 'node:process'
import { stringify } from 'structured-clone-es'
import { createStorage } from 'unstorage'
import driverMemory from 'unstorage/drivers/memory'
import { WEBCONTAINER_STDOUT_PREFIX } from '../../shared/constants'
import { createServerFunctions } from '../rpc'

const rpc = createServerFunctions({
  cwd: process.cwd(),
  storage: createStorage<string>({
    driver: driverMemory(),
  }),
  mode: 'dev',
})

async function run() {
  console.log(WEBCONTAINER_STDOUT_PREFIX + stringify(await rpc.getPayload()))
}

run()

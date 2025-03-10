/**
 * This is the entry point that we bundles with Rollup into a single file.
 *
 * The dist is located at `runtime/webcontainer-server.mjs` by `pnpm run wc:prepare`.
 *
 * The dist will be send to WebConainter to create the server to communicate with the main app.
 */

import type { NpmMeta, NpmMetaLatest } from 'node-modules-tools'
import process from 'node:process'
import { stringify } from 'structured-clone-es'
import { createStorage } from 'unstorage'
import driverMemory from 'unstorage/drivers/memory'
import { WEBCONTAINER_STDOUT_PREFIX } from '../../shared/constants'
import { createServerFunctions } from '../rpc'

const rpc = createServerFunctions({
  cwd: process.cwd(),
  storageNpmMeta: createStorage<NpmMeta>({ driver: driverMemory() }),
  storageNpmMetaLatest: createStorage<NpmMetaLatest>({ driver: driverMemory() }),
  mode: 'dev',
})

async function run() {
  // eslint-disable-next-line unimport/auto-insert
  const heartbeat = setInterval(() => {
    console.log(WEBCONTAINER_STDOUT_PREFIX + stringify({ status: 'heartbeat', heartbeat: Date.now() }))
  }, 100)

  try {
    console.log(WEBCONTAINER_STDOUT_PREFIX + stringify(await rpc.getPayload()))
  }
  catch (err) {
    console.log(WEBCONTAINER_STDOUT_PREFIX + stringify({ status: 'error', error: err }))
  }
  finally {
    clearInterval(heartbeat)
  }
}

run()

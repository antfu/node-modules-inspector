/**
 * This is the entry point that we bundles with Rollup into a single file.
 *
 * The dist is located at `runtime/webcontainer-server.mjs` by `pnpm run wc:prepare`.
 *
 * The dist will be send to WebConainter to create the server to communicate with the main app.
 */

/* eslint-disable antfu/no-top-level-await */
import process from 'node:process'
import { createWsServer } from '../ws'

const wss = await createWsServer({
  cwd: process.cwd(),
})

console.log(JSON.stringify(await wss.getMetadata()))

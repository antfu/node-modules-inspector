/* eslint-disable antfu/no-top-level-await */
import process from 'node:process'
import { WEBCONTAINER_STDOUT_MARKER } from '../../shared/constants'
import { createWsServer } from '../ws'

const wss = await createWsServer({
  cwd: process.cwd(),
})

console.log(WEBCONTAINER_STDOUT_MARKER + JSON.stringify(await wss.getMetadata()))

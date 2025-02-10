/**
 * This is the entry point that we bundles with Rollup into a single file.
 *
 * The dist is located at `runtime/webcontainer-server.mjs` by `pnpm run wc:prepare`.
 *
 * The dist will be send to WebConainter to create the server to communicate with the main app.
 */

// import type { ListPackageDependenciesOptions } from 'node-modules-tools'
// import { createServer } from 'node:http'
import process from 'node:process'
// import { createApp, eventHandler, toNodeListener } from 'h3'
import { stringify } from 'structured-clone-es'
import { WEBCONTAINER_STDOUT_PREFIX } from '../../shared/constants'
import { createServerFunctions } from '../rpc'
// import { createServerFunctions } from '../rpc'

const rpc = createServerFunctions({ cwd: process.cwd() })

// export async function createRestfulServer() {
//   const app = createApp()

//   app.use('/', eventHandler(async () => {
//     return `
// <!DOCTYPE html>
// <html lang="en">
// <script>
// self.addEventListener('message', async (event) => {
//     console.log('event', event)
//     if (event.data.type === 'list') {
//       return self.parent.postMessage({
//         type: 'list',
//         data: await fetch('/api/list-dependencies').then(res => res.text())
//       }. '*')
//     }
//   }
// })
// </script>
// `
//   }))

//   app.use('/api/list-dependencies', eventHandler(async () => {
//     return stringify(await rpc.listDependencies())
//   }))

//   return createServer(toNodeListener(app))
// }

// const server = await createRestfulServer()

// const port = 7815
// server.listen(7815)
// console.log({ port })
async function run() {
  console.log(WEBCONTAINER_STDOUT_PREFIX + stringify(await rpc.listDependencies()))
}

run()

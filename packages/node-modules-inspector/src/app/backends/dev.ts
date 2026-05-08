import type { ConnectionMeta } from 'devframe/types'
import type { Backend } from '../types/backend'
import { connectDevtool } from 'devframe/client'
import { ref, shallowRef } from 'vue'
import { useRuntimeConfig } from '#app/nuxt'

export async function createDevBackend(): Promise<Backend> {
  const config = useRuntimeConfig()
  const baseURL = config.app.baseURL || './'

  // In Nuxt dev (`nuxi dev`) the SPA is served on Nitro's port; the devframe
  // server runs on a separate port discovered via /api/metadata.json. In the
  // production CLI / static build the connection meta is at ./__connection.json
  // and `connectDevtool` finds it via the relative baseURL.
  let connectionMeta: ConnectionMeta | undefined
  if (import.meta.env.DEV) {
    try {
      connectionMeta = await fetch(`${baseURL}api/metadata.json`).then(r => r.json()) as ConnectionMeta
    }
    catch {
      // No metadata.json route — fall through to __connection.json discovery.
    }
  }

  const status: Backend['status'] = ref('connecting')
  const connectionError = shallowRef<unknown | undefined>(undefined)

  const rpc = await connectDevtool({ baseURL, connectionMeta })
  status.value = 'connected'

  const isWebsocket = rpc.connectionMeta.backend === 'websocket'
  const call = rpc.call as (method: string, ...args: any[]) => Promise<any>
  const callEvent = rpc.callEvent as (method: string, ...args: any[]) => Promise<void>

  return {
    name: isWebsocket ? 'dev' : 'static',
    status,
    connectionError,
    isDynamic: isWebsocket,
    connect() {},
    functions: {
      getPayload: async (force?: boolean) => {
        try {
          return await call('nmi:get-payload', force)
        }
        catch (err) {
          connectionError.value = err
          throw err
        }
      },
      getPackagesNpmMeta: isWebsocket
        ? (specs: string[]) => call('nmi:get-packages-npm-meta', specs)
        : undefined,
      getPackagesNpmMetaLatest: isWebsocket
        ? (pkgNames: string[]) => call('nmi:get-packages-npm-meta-latest', pkgNames)
        : undefined,
      getPublint: isWebsocket
        ? (pkg: any) => call('nmi:get-publint', pkg)
        : undefined,
      openInEditor: isWebsocket
        ? (filename: string) => { void callEvent('nmi:open-in-editor', filename) }
        : undefined,
      openInFinder: isWebsocket
        ? (filename: string) => { void callEvent('nmi:open-in-finder', filename) }
        : undefined,
    },
  }
}

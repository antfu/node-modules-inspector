import type { ConnectionMeta } from 'devframe/types'
import type { Backend } from '../types/backend'
import { connectDevframe } from 'devframe/client'
import { ref, shallowRef } from 'vue'
import { useRuntimeConfig } from '#app/nuxt'

export async function createDevBackend(): Promise<Backend> {
  const config = useRuntimeConfig()
  // devframe resolves `__connection.json` (and the static RPC dump) via ufo's
  // `withBase`, which drops the leading slash for a root ("/") base — so a bare
  // base makes the fetch relative to the current route (e.g. `/grid/depth`)
  // instead of the origin, 404ing on any non-root URL. Resolve to an absolute,
  // origin-rooted URL so discovery works regardless of the active route.
  const rawBase = config.app.baseURL || './'
  const baseURL = typeof window !== 'undefined'
    ? new URL(rawBase, window.location.origin).href
    : rawBase

  // In Nuxt dev (`nuxi dev`) the SPA is served on Nitro's port; the devframe
  // server runs on a separate port discovered via /api/metadata.json. In the
  // production CLI / static build the connection meta is at ./__connection.json
  // and `connectDevframe` finds it via the relative baseURL.
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

  const rpc = await connectDevframe({ baseURL, connectionMeta })
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

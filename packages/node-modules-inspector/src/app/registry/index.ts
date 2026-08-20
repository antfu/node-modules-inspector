import type { NpmMeta, NpmMetaLatest } from 'node-modules-tools'
import type { RegistryResolveWarning } from 'node-modules-tools/registry'
import type { NodeModulesInspectorPayload } from '../../shared/types'
import type { Backend } from '../types/backend'
import { resolveRegistryDependencies } from 'node-modules-tools/registry'
import { hash as getHash } from 'ohash'
import { createStorage } from 'unstorage'
import driverIndexedDb from 'unstorage/drivers/indexedb'
import { reactive, shallowRef } from 'vue'
import { getPackagesNpmMeta, getPackagesNpmMetaLatest } from '../../shared/version-info'

export interface RegistryProgress {
  phase: 'idle' | 'resolving' | 'manifests'
  count: number
  total: number
}

/** Live progress of the current Instant-mode resolution */
export const registryProgress = reactive<RegistryProgress>({
  phase: 'idle',
  count: 0,
  total: 0,
})

/** Non-fatal problems from the last Instant-mode resolution (skipped specs, etc.) */
export const registryWarnings = shallowRef<RegistryResolveWarning[]>([])

/**
 * Create the "Instant" backend: resolves the dependency graph purely from
 * npm-registry metadata in the browser — no WebContainer, no install.
 */
export function createRegistryBackend(
  dependencies: Record<string, string>,
  options?: { name?: string },
): Backend {
  const error = shallowRef<unknown | undefined>(undefined)

  const storageNpmMeta = createStorage<NpmMeta>({
    driver: driverIndexedDb({ base: 'nmi:npm-meta' }),
  })
  const storageNpmMetaLatest = createStorage<NpmMetaLatest>({
    driver: driverIndexedDb({ base: 'nmi:npm-meta-latest' }),
  })
  const storagePackument = createStorage({
    driver: driverIndexedDb({ base: 'nmi:registry-packument' }),
  })
  const storageManifest = createStorage({
    driver: driverIndexedDb({ base: 'nmi:registry-manifest' }),
  })

  async function getPayload(): Promise<NodeModulesInspectorPayload> {
    registryProgress.phase = 'resolving'
    registryProgress.count = 0
    registryProgress.total = 0
    registryWarnings.value = []

    try {
      const { warnings, ...result } = await resolveRegistryDependencies({
        dependencies,
        cachePackument: storagePackument,
        cacheManifest: storageManifest,
        onProgress(progress) {
          registryProgress.phase = progress.phase
          registryProgress.count = progress.count
          registryProgress.total = progress.total ?? 0
        },
      })
      registryWarnings.value = warnings

      return {
        hash: getHash([...result.packages.keys()].sort()),
        timestamp: Date.now(),
        ...result,
        config: {
          name: options?.name,
          fetchNpmMeta: true,
          publint: false,
        },
      }
    }
    finally {
      registryProgress.phase = 'idle'
    }
  }

  return {
    name: 'registry',
    connectionError: error,
    status: shallowRef('connected'),
    connect() {
      error.value = undefined
    },
    functions: {
      getPayload,
      getPackagesNpmMeta: deps => getPackagesNpmMeta(deps, { storageNpmMeta }),
      getPackagesNpmMetaLatest: pkgNames => getPackagesNpmMetaLatest(pkgNames, { storageNpmMetaLatest }),
    },
  }
}

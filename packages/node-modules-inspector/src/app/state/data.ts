import type { NpmMeta, NpmMetaLatest, PackageNode, PublintMessage } from 'node-modules-tools'
import type { NodeModulesInspectorPayload } from '../../shared/types'
import { ref, shallowRef, toRaw } from 'vue'
import { isNpmMetaLatestValid } from '../../shared/utils'
import { getBackend } from '../backends'
import { filters, filtersDefault } from './filters'
import { settings } from './settings'

export const rawPayload = shallowRef<NodeModulesInspectorPayload | null>(null)
export const rawReferencePayload = shallowRef<NodeModulesInspectorPayload | null>(null)
export const rawNpmMeta = ref<Map<string, NpmMeta | null>>(new Map())
export const rawNpmMetaLatest = ref<Map<string, NpmMetaLatest | null>>(new Map())
export const rawPublintMessages = ref<Map<string, readonly PublintMessage[] | null>>(new Map())

export async function fetchData(force = false) {
  rawPayload.value = null
  const backend = getBackend()
  try {
    const data = await backend.functions.getPayload(force)

    Object.freeze(data)
    for (const pkg of data.packages.values())
      Object.freeze(pkg)

    rawPayload.value = data

    Object.assign(settings.value, structuredClone(toRaw(data.config?.defaultSettings || {})))
    Object.assign(filters.state, structuredClone(toRaw(filtersDefault.value)))

    const promises: Promise<void>[] = []

    const npmMetaSpecs = [...data.packages.entries()]
      .filter(x => !x[1].private && !x[1].workspace && !x[1].resolved.npmMeta?.publishedAt)
      .map(x => x[0])

    const npmMetaLatestNames = [...data.packages.entries()]
      .filter(x => !x[1].private && !x[1].workspace && !isNpmMetaLatestValid(x[1].resolved.npmMetaLatest))
      .map(x => x[1].name)

    if (backend.functions.getPackagesNpmMeta && npmMetaSpecs.length) {
      promises.push(backend.functions.getPackagesNpmMeta(npmMetaSpecs)
        .then((result) => {
          if (result) {
            for (const [spec, meta] of result.entries())
              rawNpmMeta.value.set(spec, Object.freeze(meta))
          }
        }))
    }

    if (backend.functions.getPackagesNpmMetaLatest && npmMetaLatestNames.length) {
      promises.push(backend.functions.getPackagesNpmMetaLatest(npmMetaLatestNames)
        .then((result) => {
          if (result) {
            for (const [spec, meta] of result.entries())
              rawNpmMetaLatest.value.set(spec, Object.freeze(meta))
          }
        }))
    }

    await Promise.all(promises)

    return rawPayload.value
  }
  catch (err) {
    console.error(err)
    if (backend)
      backend.connectionError.value = err
    rawPayload.value = null
    return null
  }
}

const _fetchPublintPromise = new Map<string, Promise<PublintMessage[] | null>>()
export async function fetchPublintMessages(pkg: PackageNode) {
  if (!rawPayload.value?.config?.publint)
    return null
  if (rawPublintMessages.value?.has(pkg.spec))
    return rawPublintMessages.value.get(pkg.spec) || null
  if (!_fetchPublintPromise.has(pkg.spec)) {
    const promise = _fetchPublintMessages(pkg)
    _fetchPublintPromise.set(pkg.spec, promise)
  }
  return _fetchPublintPromise.get(pkg.spec)
}

async function _fetchPublintMessages(pkg: PackageNode): Promise<PublintMessage[] | null> {
  const backend = getBackend()
  if (backend.functions.getPublint) {
    const result = await backend.functions.getPublint({
      private: pkg.private,
      workspace: pkg.workspace,
      spec: pkg.spec,
      filepath: pkg.filepath,
    })
    rawPublintMessages.value.set(pkg.spec, result ? Object.freeze(result) : null)
    return result
  }
  return null
}

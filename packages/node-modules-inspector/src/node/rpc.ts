import type { ListPackageDependenciesOptions } from 'node-modules-tools'
import type { Message as PublintMessage } from 'publint'
import type { Storage } from 'unstorage'
import type { ListPackagePublishDatesOptions } from '../shared/publish-date'
import type { NodeModulesInspectorConfig, NodeModulesInspectorPayload, ServerFunctions } from '../shared/types'
import process from 'node:process'
import c from 'ansis'
import { constructPackageFilters, listPackageDependencies } from 'node-modules-tools'
import { hash as getHash } from 'ohash'
import pLimit from 'p-limit'
import { loadConfig } from 'unconfig'
import { getPackagesPublishDate as _getPackagesPublishDate } from '../shared/publish-date'
import { MARK_CHECK, MARK_NODE } from './constants'

export interface CreateServerFunctionsOptions extends Partial<ListPackageDependenciesOptions>, ListPackagePublishDatesOptions {
  mode: 'dev' | 'build'

  storagePublint?: Storage<PublintMessage[]>
}

export function createServerFunctions(options: CreateServerFunctionsOptions): ServerFunctions {
  let _config: Promise<NodeModulesInspectorConfig> | null = null
  let _payload: Promise<NodeModulesInspectorPayload> | null = null

  async function getConfig(force = false) {
    if (force)
      _config = null
    if (!_config)
      _config = _getConfig()
    return _config
  }

  async function _getConfig() {
    const result = await loadConfig<NodeModulesInspectorConfig>({
      cwd: options.cwd,
      sources: [
        {
          files: 'node-modules-inspector.config',
        },
      ],
      defaults: {
        fetchPublishDate: true,
        publint: false,
      },
      merge: true,
    })
    if (result.sources.length)
      console.log(c.green`${MARK_CHECK} Config loaded from ${result.sources.join(', ')}`)
    return result.config
  }

  async function getPackagesPublishDate(deps: string[]) {
    const config = await getConfig()
    if (!config.fetchPublishDate)
      return new Map()
    console.log(c.cyan`${MARK_NODE} Fetching publish dates...`)
    return _getPackagesPublishDate(deps, { storagePublishDates: options.storagePublishDates })
  }

  function getPayload(force?: boolean) {
    if (force) {
      _config = null
      _payload = null
    }
    if (!_payload)
      _payload = _getPayload()
    return _payload
  }

  async function _getPayload() {
    const config = await getConfig()
    const excludeFilter = constructPackageFilters(config.excludePackages || [], 'some')
    const depsFilter = constructPackageFilters(config.excludeDependenciesOf || [], 'some')
    console.log(c.cyan`${MARK_NODE} Reading node_modules...`)
    const result = await listPackageDependencies({
      cwd: process.cwd(),
      depth: 25,
      monorepo: true,
      ...options,
      traverseFilter(node) {
        return !excludeFilter(node)
      },
      dependenciesFilter(node) {
        return !depsFilter(node)
      },
    })

    const hash = getHash([...result.packages.keys()].sort())

    if (config.publint) {
      console.log(c.cyan`${MARK_NODE} Running publint...`)
      const { publint } = await import('publint')
      const limit = pLimit(20)
      await Promise.all([...result.packages.values()].map(pkg => limit(async () => {
        let result = await options.storagePublint?.getItem(pkg.spec) || undefined
        if (!result) {
          result = await publint({
            pack: false,
            pkgDir: pkg.filepath,
            strict: false,
          }).then(r => r.messages) || []
          await options.storagePublint?.setItem(pkg.spec, result)
        }
        pkg.resolved.publint = result
      })))
    }

    // For build mode, we fetch the publish date
    if (options.mode === 'build' && config.fetchPublishDate) {
      console.log(c.cyan`${MARK_NODE} Fetching publish dates...`)
      try {
        await getPackagesPublishDate(Array.from(result.packages.keys()))
      }
      catch (e) {
        console.error(c.red`${MARK_NODE} Failed to fetch publish dates`)
        console.error(e)
      }
      console.log(c.green`${MARK_CHECK} Publish dates fetched`)
    }

    // Fullfill the publish time
    await Promise.all(Array.from(result.packages.values())
      .map(async (pkg) => {
        const time = await options.storagePublishDates.getItem(pkg.spec)
        if (time)
          pkg.resolved.publishTime = time
      }))

    console.log(c.green`${MARK_CHECK} node_modules read finished`)

    return {
      hash,
      timestamp: Date.now(),
      ...result,
      config,
    }
  }

  return {
    getPayload,
    getPackagesPublishDate,
    async openInEditor(filename: string) {
      await import('launch-editor').then(r => (r.default || r)(filename))
    },
    async openInFinder(filename: string) {
      await import('open').then(r => r.default(filename))
    },
  }
}

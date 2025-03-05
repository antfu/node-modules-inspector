import type { ListPackageDependenciesOptions } from 'node-modules-tools'
import type { ListPackagePublishDatesOptions } from '../shared/publish-date'
import type { NodeModulesInspectorConfig, ServerFunctions } from '../shared/types'
import process from 'node:process'
import c from 'ansis'
import { constructPackageFilters, listPackageDependencies } from 'node-modules-tools'
import { hash as getHash } from 'ohash'
import { loadConfig } from 'unconfig'
import { getPackagesPublishDate as _getPackagesPublishDate } from '../shared/publish-date'
import { MARK_CHECK, MARK_NODE } from './constants'

export interface CreateServerFunctionsOptions extends Partial<ListPackageDependenciesOptions>, ListPackagePublishDatesOptions {
  mode: 'dev' | 'build'
}

export function createServerFunctions(options: CreateServerFunctionsOptions): ServerFunctions {
  let _config: Promise<NodeModulesInspectorConfig> | null = null
  const getConfig = async (force = false) => {
    if (!force && _config)
      return _config
    _config = (async () => {
      const result = await loadConfig<NodeModulesInspectorConfig>({
        cwd: options.cwd,
        sources: [
          {
            files: 'node-modules-inspector.config',
          },
        ],
        defaults: {
          fetchPublishDate: true,
        },
        merge: true,
      })
      if (result.sources.length)
        console.log(c.green`${MARK_CHECK} Config loaded from ${result.sources.join(', ')}`)
      else
        console.log(c.yellow`${MARK_NODE} No config found`)
      return result.config
    })()
    return _config
  }

  async function getPackagesPublishDate(deps: string[]) {
    const config = await getConfig()
    if (!config.fetchPublishDate)
      return new Map()
    console.log(c.green`${MARK_NODE} Fetching publish dates...`)
    return _getPackagesPublishDate(deps, { storagePublishDates: options.storagePublishDates })
  }

  return {
    async getPayload(force?: boolean) {
      const config = await getConfig(force)
      const excludeFilter = constructPackageFilters(config.excludePackages || [], 'some')
      const depsFilter = constructPackageFilters(config.excludeDependenciesOf || [], 'some')
      console.log(c.green`${MARK_NODE} Reading node_modules...`)
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

      // For build mode, we fetch the publish date
      if (options.mode === 'build' && config.fetchPublishDate) {
        console.log(c.green`${MARK_NODE} Fetching publish dates...`)
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
    },
    getPackagesPublishDate,
    async openInEditor(filename: string) {
      await import('launch-editor').then(r => (r.default || r)(filename))
    },
    async openInFinder(filename: string) {
      await import('open').then(r => r.default(filename))
    },
  }
}

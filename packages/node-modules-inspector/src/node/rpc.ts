import type { ListPackageDependenciesOptions } from 'node-modules-tools'
import type { ListPackagePublishDatesOptions } from '../shared/publish-date'
import type { NodeModulesInspectorConfig, ServerFunctions } from '../shared/types'
import process from 'node:process'
import { constructPackageFilters, listPackageDependencies } from 'node-modules-tools'
import { loadConfig } from 'unconfig'
import { getPackagesPublishDate } from '../shared/publish-date'

export interface CreateServerFunctionsOptions
  extends Partial<ListPackageDependenciesOptions>, ListPackagePublishDatesOptions {
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
        defaults: {},
      })
      if (result.sources.length)
        console.log(`[Node Modules Inspector] Config loaded from ${result.sources.join(', ')}`)
      else
        console.log('[Node Modules Inspector] No config found')
      return result.config
    })()
    return _config
  }

  return {
    async getPayload(force?: boolean) {
      const config = await getConfig(force)
      const excludeFilter = constructPackageFilters(config.excludePackages || [], 'some')
      const depsFilter = constructPackageFilters(config.excludeDependenciesOf || [], 'some')
      console.log('[Node Modules Inspector] Reading dependencies...')
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

      await Promise.all(Array.from(result.packages.values())
        .map(async (pkg) => {
          const time = await options.storage.getItem(pkg.spec)
          if (time)
            pkg.resolved.publishTime = time
        }))

      return {
        ...result,
        config,
      }
    },
    async getPackagesPublishDate(deps: string[]) {
      console.log('[Node Modules Inspector] Fetching publish dates...')
      return getPackagesPublishDate(deps, { storage: options.storage })
    },
    async openInEditor(filename: string) {
      // @ts-expect-error missing types
      await import('launch-editor').then(r => (r.default || r)(filename))
    },
    async openInFinder(filename: string) {
      await import('open').then(r => r.default(filename))
    },
  }
}

import type { ServerFunctions } from '#shared/types'
import type { ListPackageDependenciesOptions } from 'node-modules-tools'
import type { ListPackagePublishDatesOptions } from '../shared/publish-date'
import type { NodeModulesInspectorConfig } from './config'
import process from 'node:process'
import { listPackageDependencies } from 'node-modules-tools'
import { loadConfig } from 'unconfig'
import { getPackagesPublishDate } from '../shared/publish-date'

export interface CreateServerFunctionsOptions
  extends Partial<ListPackageDependenciesOptions>, ListPackagePublishDatesOptions {
}

export function createServerFunctions(options: CreateServerFunctionsOptions): ServerFunctions {
  return {
    async getConfig() {
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
    },
    async listDependencies() {
      console.log('[Node Modules Inspector] Reading dependencies...')
      return listPackageDependencies({
        cwd: process.cwd(),
        depth: 25,
        monorepo: true,
        ...options,
      })
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

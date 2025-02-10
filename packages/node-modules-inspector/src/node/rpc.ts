import type { ServerFunctions } from '#shared/types'
import type { ListPackageDependenciesOptions } from 'node-modules-tools'
import type { ListPackagePublishDatesOptions } from '../shared/publish-date'
import process from 'node:process'
import { listPackageDependencies } from 'node-modules-tools'
import { getPackagesPublishDate } from '../shared/publish-date'

export interface CreateServerFunctionsOptions
  extends Partial<ListPackageDependenciesOptions>, ListPackagePublishDatesOptions {
}

export function createServerFunctions(options: CreateServerFunctionsOptions): ServerFunctions {
  return {
    async listDependencies() {
      return listPackageDependencies({
        cwd: process.cwd(),
        depth: 25,
        monorepo: true,
        ...options,
      })
    },
    async getPackagesPublishDate(deps: string[]) {
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

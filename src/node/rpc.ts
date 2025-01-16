import type { ServerFunctions } from '~~/shared/types'
import process from 'node:process'
import { listPackageDependencies } from 'node-modules-tools'

export async function createServerFunctions(): Promise<ServerFunctions> {
  return {
    listDependencies() {
      console.log('listDependencies')
      // TODO: pass in options
      return listPackageDependencies({
        cwd: process.cwd(),
        depth: 25,
        monorepo: true,
      })
    },
  }
}

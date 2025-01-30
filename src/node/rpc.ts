import type { ServerFunctions } from '~~/shared/types'
import process from 'node:process'
import { listPackageDependencies, resolvePackage } from 'node-modules-tools'

export async function createServerFunctions(): Promise<ServerFunctions> {
  return {
    async listDependencies() {
      // TODO: pass in options
      const result = await listPackageDependencies({
        cwd: process.cwd(),
        depth: 25,
        monorepo: true,
      })
      await Promise.all(result.packages.map(async pkg => resolvePackage(pkg)))
      return result
    },
  }
}

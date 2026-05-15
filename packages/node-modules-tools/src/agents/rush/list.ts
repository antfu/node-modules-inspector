import type { ListPackageDependenciesOptions, ListPackageDependenciesRawResult } from '../../types'
import { listPackageDependenciesWithExecutable } from '../pnpm/core'

export async function listPackageDependencies(
  options: ListPackageDependenciesOptions,
): Promise<ListPackageDependenciesRawResult> {
  return listPackageDependenciesWithExecutable(options, {
    executable: 'rush-pnpm',
    packageManagerName: 'rush-pnpm',
  })
}

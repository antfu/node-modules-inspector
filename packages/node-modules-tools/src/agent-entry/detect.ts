import type { AgentName } from 'package-manager-detector'
import type { BaseOptions } from '../types'
import { detect } from 'package-manager-detector'
import { isRushMonorepo } from '../utils/rush'

export async function getPackageManager(options: BaseOptions): Promise<AgentName> {
  // Rush monorepos use pnpm under the hood via `rush-pnpm`.
  // Detect Rush first so the pnpm agent can pick the right executable.
  if (isRushMonorepo(options.cwd)) {
    options.rush = true
    return 'pnpm'
  }

  const manager = await detect({
    cwd: options.cwd,
  })
  if (!manager)
    throw new Error('Cannot detect package manager in the current path')

  return manager.name
}

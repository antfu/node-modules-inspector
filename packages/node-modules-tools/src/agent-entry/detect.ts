import type { AgentName } from 'package-manager-detector'
import type { BaseOptions } from '../types'
import { existsSync } from 'node:fs'
import { detect } from 'package-manager-detector'
import { join } from 'pathe'

export type AgentNameExtended = AgentName | 'rush-pnpm'

export async function getPackageManager(options: BaseOptions): Promise<AgentNameExtended> {
  // Detect Rush monorepo before generic detection
  if (existsSync(join(options.cwd, 'rush.json'))) {
    return 'rush-pnpm'
  }

  const manager = await detect({
    cwd: options.cwd,
  })
  if (!manager)
    throw new Error('Cannot detect package manager in the current path')

  return manager.name
}

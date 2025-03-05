import type { Agent } from 'package-manager-detector'
import type { BaseOptions } from '../types'
import { detect } from 'package-manager-detector'

export async function getPackageManager(options: BaseOptions): Promise<Agent> {
  const manager = await detect({
    cwd: options.cwd,
  })
  if (!manager)
    throw new Error('Cannot detect package manager in the current path')

  return manager.agent
}

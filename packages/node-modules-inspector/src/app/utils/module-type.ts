import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { settings } from '~/state/settings'

export const MODULE_TYPES_FULL = ['dual', 'esm', 'faux', 'cjs', 'dts'] as PackageModuleType[]
export const MODULE_TYPES_SIMPLE = ['esm', 'cjs', 'dts'] as PackageModuleType[]

// @unocss-include
export const MODULE_TYPES_COLOR_BADGE = {
  esm: 'bg-green:20 dark:bg-green:10 text-green-700 dark:text-green-300 border-green:10',
  dual: 'bg-teal:20 dark:bg-teal:10 text-teal-700 dark:text-teal-300 border-teal:10',
  cjs: 'bg-yellow:20 dark:bg-yellow:10 text-yellow-700 dark:text-yellow-300 border-yellow:10',
  faux: 'bg-lime:20 dark:bg-lime:10 text-lime-700 dark:text-lime-300 border-lime:10',
  dts: 'bg-gray:10 dark:bg-gray:8 text-gray-700:50 dark:text-gray-300:50 border-gray:10',
}

export function getModuleType(node: PackageNode | PackageModuleType) {
  const type = typeof node === 'string' ? node : node.resolved.module

  if (!settings.value.moduleTypeSimple)
    return type

  if (type === 'dts')
    return 'dts'
  if (['cjs', 'faux'].includes(type))
    return 'cjs'
  return 'esm'
}

export function getModuleTypeCounts(nodes: Iterable<PackageNode>) {
  const counts = Object.fromEntries(MODULE_TYPES_FULL.map(type => [type, 0])) as Record<PackageModuleType, number>
  for (const node of nodes) {
    const type = getModuleType(node)
    counts[type] += 1
  }
  return counts
}

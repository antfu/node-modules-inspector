import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { settings } from '~/state/settings'

export const MODULE_TYPES_FULL = ['dual', 'esm', 'faux', 'cjs', 'dts'] as PackageModuleType[]
export const MODULE_TYPES_SIMPLE = ['esm', 'cjs', 'dts'] as PackageModuleType[]

// @unocss-include
export const MODULE_TYPES_COLOR_BADGE = {
  esm: 'badge-color-green',
  dual: 'badge-color-teal',
  cjs: 'badge-color-yellow',
  faux: 'badge-color-lime',
  dts: 'badge-color-gray',
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

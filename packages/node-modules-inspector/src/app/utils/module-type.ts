import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { settings } from '~/state/settings'

export function getModuleType(node: PackageNode | PackageModuleType) {
  const type = typeof node === 'string' ? node : node.resolved.module

  if (!settings.value.moduleTypeSimple)
    return type

  if (['cjs', 'faux'].includes(type))
    return 'cjs'
  return 'esm'
}

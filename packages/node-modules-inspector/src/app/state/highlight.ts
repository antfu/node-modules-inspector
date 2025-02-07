import type { PackageNode } from 'node-modules-tools'
import { payloads } from './payload'

export type HighlightMode = 'focus' | 'compare'

export function getCompareHighlight(pkg: PackageNode) {
  const a = payloads.compareA.has(pkg)
  const b = payloads.compareB.has(pkg)
  if (a && b)
    return 'both'
  if (a)
    return 'a'
  if (b)
    return 'b'
  return 'none'
}

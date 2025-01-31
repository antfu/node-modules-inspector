import type { ResolvedPackageNode } from 'node-modules-tools'
import { shallowRef } from 'vue'

export const selectedNode = shallowRef<null | ResolvedPackageNode>(null)

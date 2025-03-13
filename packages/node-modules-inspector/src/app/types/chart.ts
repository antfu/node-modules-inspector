import type { TreeNode } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'

export type ChartNode = TreeNode<PackageNode | undefined>

<script setup lang="ts">
import type { HierarchyLink, HierarchyNode } from 'd3-hierarchy'
import type { ResolvedPackageNode } from 'node-modules-tools'
import { hierarchy, tree } from 'd3-hierarchy'
import { linkHorizontal } from 'd3-shape'
import { nextTick, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { query } from '~/state/query'

const props = defineProps<{
  packages: ResolvedPackageNode[]
}>()

const svg = useTemplateRef<SVGSVGElement>('svg')
const el = useTemplateRef<HTMLDivElement>('el')
const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

const nodes = shallowRef<HierarchyNode<ResolvedPackageNode>[]>([])
const links = shallowRef<HierarchyLink<ResolvedPackageNode>[]>([])
const nodesMap = new Map<string, HierarchyNode<ResolvedPackageNode>>()

const NODE_WIDTH = 400
const NODE_HEIGHT = 30
const NODE_MARGIN = 30

onMounted(() => {
  const topLevel = props.packages.filter(pkg => !pkg.flatDependents.size)

  const seen = new Set<ResolvedPackageNode>()
  const root = hierarchy<ResolvedPackageNode>(
    { name: '~root', spec: '~root' } as any,
    (d) => {
      if (d.name === '~root') {
        topLevel.forEach(x => seen.add(x))
        return topLevel
      }
      const children = Array.from(d.dependencies)
        .map(i => props.packages.find(x => x.spec === i))
        .filter(x => !!x)
        .filter(x => !seen.has(x))
      children.forEach(x => seen.add(x))
      return children
    },
  )

  // Calculate the layout
  const layout = tree<ResolvedPackageNode>()
    .nodeSize([NODE_HEIGHT, NODE_WIDTH + 200])
  layout(root)

  const _nodes = root.descendants()
  _nodes
    .forEach((node) => {
      [node.x, node.y] = [node.y! - NODE_WIDTH, node.x!]
    })

  // Offset the graph to the top left
  const minX = Math.min(..._nodes.map(n => n.x!))
  const minY = Math.min(..._nodes.map(n => n.y!))
  if (minX < NODE_MARGIN) {
    _nodes.forEach((node) => {
      node.x! += Math.abs(minX) + NODE_MARGIN
    })
  }
  if (minY < NODE_MARGIN) {
    _nodes.forEach((node) => {
      node.y! += Math.abs(minY) + NODE_MARGIN
    })
  }

  nodes.value = _nodes
  for (const node of _nodes) {
    nodesMap.set(node.data.spec, node)
  }
  links.value = root.links()
  // links.value = _nodes
  //   .slice(1)
  //   .flatMap((node) => {
  //     return Array.from(node.data.dependencies)
  //       .map((spec) => {
  //         return { source: node, target: nodesMap.get(spec)! }
  //       })
  //   })

  nextTick(() => {
    width.value = el.value!.scrollWidth
    height.value = el.value!.scrollHeight
  })
})

function getSelectionMode(node: ResolvedPackageNode) {
  if (!query.selected || query.selected.startsWith('~'))
    return 'none'
  if (node.spec === query.selected || node.flatDependencies.has(query.selected) || node.flatDependents.has(query.selected))
    return 'selected'
  return 'faded'
}

const createLink = linkHorizontal()
  .x(d => d[0])
  .y(d => d[1])

function generateLink(link: HierarchyLink<ResolvedPackageNode>) {
  const [source, target] = [link.source, link.target].sort((a, b) => a.x! - b.x!)
  return createLink({
    source: [source.x! + NODE_WIDTH / 2 - 40, source.y!],
    target: [target.x! - NODE_WIDTH / 2 + 40, target.y!],
  })
}
</script>

<template>
  <div ref="el" w-screen h-screen of-scroll absolute inset-0 relative flex="~ items-center justify-center">
    <svg ref="svg" absolute left-0 top-0 :width="width" :height="height">
      <g>
        <template
          v-for="(link, index) in links"
          :key="index"
        >
          <path
            v-if="link.source.data.spec !== '~root' && link.source.x !== link.target.x"
            :d="generateLink(link)!"
            fill="none"
            :stroke="getSelectionMode(link.source.data) === 'selected' && getSelectionMode(link.target.data) === 'selected' ? 'rgb(66,187,215)' : '#8883'"
          />
        </template>
      </g>
    </svg>
    <template
      v-for="node of nodes"
      :key="node.data.spec"
    >
      <template v-if="node.data.spec !== '~root'">
        <PackageInfoNode
          :selection-mode="getSelectionMode(node.data)"
          :pkg="node.data"
          :style="{
            left: `${node.x}px`,
            top: `${node.y}px`,
            minWidth: `${NODE_WIDTH}px`,
          }"
        />
      </template>
    </template>
  </div>
</template>

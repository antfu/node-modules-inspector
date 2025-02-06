<script setup lang="ts">
import type { HierarchyLink, HierarchyNode } from 'd3-hierarchy'
import type { PackageNode } from 'node-modules-tools'
import type { ComputedPayload } from '~/state/payload'
import { useEventListener } from '@vueuse/core'
import { hierarchy, tree } from 'd3-hierarchy'
import { linkHorizontal, linkVertical } from 'd3-shape'
import { computed, nextTick, onMounted, ref, shallowReactive, shallowRef, useTemplateRef, watch } from 'vue'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'
import { payloads } from '~/state/payload'
import { query } from '~/state/query'

const { payload } = defineProps<{
  payload: ComputedPayload
}>()

interface Link extends HierarchyLink<PackageNode> {
  id: string
}

const svgLinks = useTemplateRef<SVGSVGElement>('svgLinks')
const svgLinksActive = useTemplateRef<SVGSVGElement>('svgLinksActive')
const container = useTemplateRef<HTMLDivElement>('container')
const screenshotTarget = useTemplateRef<HTMLDivElement>('screenshotTarget')

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

const nodes = shallowRef<HierarchyNode<PackageNode>[]>([])
const links = shallowRef<Link[]>([])
const nodesMap = shallowReactive(new Map<string, HierarchyNode<PackageNode>>())
const linksMap = shallowReactive(new Map<string, Link>())

const nodesRefMap = new Map<string, HTMLDivElement>()

const NODE_WIDTH = 300
const NODE_HEIGHT = 30
const NODE_LINK_OFFSET = 20
const NODE_MARGIN = 200
const NODE_GAP = 150

const rootPackages = computed(() => {
  if (filters.state.focus?.length)
    return filters.state.focus.map(payload.get).filter(x => !!x)

  const sortedByDepth = [...payload.packages].sort((a, b) => b.depth - a.depth)
  const rootMap = new Map<string, PackageNode>(payload.packages.map(x => [x.spec, x]))
  let changed = true
  while (changed) {
    changed = false
    for (const pkg of sortedByDepth) {
      if (pkg.workspace)
        continue
      if (!rootMap.has(pkg.spec))
        continue
      for (const parent of pkg.dependents) {
        if (rootMap.has(parent)) {
          rootMap.delete(pkg.spec)
          changed = true
        }
      }
    }
  }

  const rootPackages = Array.from(rootMap.values())
    .sort((a, b) => a.depth - b.depth || b.flatDependencies.size - a.flatDependencies.size)

  return rootPackages
})

function calculateGraph() {
  // Unset the canvas size, and recalculate again after nodes are rendered
  width.value = window.innerWidth
  height.value = window.innerHeight

  const seen = new Set<PackageNode>()
  const root = hierarchy<PackageNode>(
    { name: '~root', spec: '~root' } as any,
    (node) => {
      if (node.name === '~root') {
        rootPackages.value.forEach(x => seen.add(x))
        return rootPackages.value
      }
      const children = payload.dependencies(node)
        .filter(x => !seen.has(x))
        .sort((a, b) => a.depth - b.depth || payload.flatDependencies(b).length - payload.flatDependencies(a).length)
      children.forEach(x => seen.add(x))
      return children
    },
  )

  // Calculate the layout
  const layout = tree<PackageNode>()
    .nodeSize([NODE_HEIGHT, NODE_WIDTH + NODE_GAP])
  layout(root)

  // Rotate the graph from top-down to left-right
  const _nodes = root.descendants()
  for (const node of _nodes) {
    [node.x, node.y] = [node.y! - NODE_WIDTH, node.x!]
  }

  // Offset the graph and adding margin
  const minX = Math.min(..._nodes.map(n => n.x!))
  const minY = Math.min(..._nodes.map(n => n.y!))
  if (minX < NODE_MARGIN) {
    for (const node of _nodes) {
      node.x! += Math.abs(minX) + NODE_MARGIN
    }
  }
  if (minY < NODE_MARGIN) {
    for (const node of _nodes) {
      node.y! += Math.abs(minY) + NODE_MARGIN
    }
  }

  nodes.value = _nodes
  nodesMap.clear()
  for (const node of _nodes) {
    nodesMap.set(node.data.spec, node)
  }
  const _links = root.links()
    .filter(x => x.source.data.name !== '~root')
    .map((x) => {
      return {
        ...x,
        id: `${x.source.data.spec}|${x.target.data.spec}`,
      }
    })
  linksMap.clear()
  for (const link of _links) {
    linksMap.set(link.id, link)
  }
  links.value = _links

  nextTick(() => {
    width.value = container.value!.scrollWidth + NODE_MARGIN
    height.value = container.value!.scrollHeight + NODE_MARGIN

    if (query.selected)
      focusOn(query.selected, false)
    else if (payload.packages[0])
      focusOn(payload.packages[0].spec, false)
  })
}

const isGrabbing = shallowRef(false)
function handleDragingScroll() {
  let x = 0
  let y = 0
  useEventListener(container, 'mousedown', (e) => {
    isGrabbing.value = true
    x = container.value!.scrollLeft + e.pageX
    y = container.value!.scrollTop + e.pageY
  })
  useEventListener('mouseleave', () => isGrabbing.value = false)
  useEventListener('mouseup', () => isGrabbing.value = false)
  useEventListener('mousemove', (e) => {
    if (!isGrabbing.value)
      return
    e.preventDefault()
    container.value!.scrollLeft = x - e.pageX
    container.value!.scrollTop = y - e.pageY
  })
}

async function takeScreenshot() {
  const { domToPng } = await import('modern-screenshot')
  const dataUrl = await domToPng(screenshotTarget.value!)
  const link = document.createElement('a')
  link.download = 'node-modules-inspector.png'
  link.href = dataUrl
  link.click()
}

const additionalLinks = computed(() => {
  if (!query.selected)
    return []
  const selected = nodesMap.get(query.selected)
  if (!selected)
    return []
  const links: Link[] = []

  for (const dep of selected.data.dependencies) {
    const id = `${selected.data.spec}|${dep}`
    if (linksMap.has(id))
      continue
    const target = nodesMap.get(dep)
    if (target)
      links.push({ id, source: selected, target })
  }

  for (const dep of selected.data.dependents) {
    const id = `${dep}|${selected.data.spec}`
    if (linksMap.has(id))
      continue
    const source = nodesMap.get(dep)
    if (source)
      links.push({ id, source, target: selected })
  }
  return links
})

const activeLinks = computed(() => {
  if (!query.selected || query.selected.startsWith('~'))
    return []
  return [
    ...links.value.filter(link => isRelated(link.source.data) && isRelated(link.target.data)),
    ...additionalLinks.value,
  ]
})

function focusOn(spec: string, animated = true) {
  const el = nodesRefMap.get(spec)
  el?.scrollIntoView({
    block: 'center',
    inline: 'center',
    behavior: animated ? 'smooth' : 'instant',
  })
}

function isRelated(pkg: PackageNode) {
  if (!selectedNode.value)
    return
  return selectedNode.value === pkg || payloads.avaliable.flatDependencies(selectedNode.value).includes(pkg) || payloads.avaliable.flatDependents(selectedNode.value).includes(pkg)
}

const createLinkHorizontal = linkHorizontal()
  .x(d => d[0])
  .y(d => d[1])

const createLinkVertical = linkVertical()
  .x(d => d[0])
  .y(d => d[1])

function generateLink(link: HierarchyLink<PackageNode>) {
  if (link.target.x! <= link.source.x!) {
    return createLinkVertical({
      source: [link.source.x! + NODE_WIDTH / 2 - NODE_LINK_OFFSET, link.source.y!],
      target: [link.target.x! - NODE_WIDTH / 2 + NODE_LINK_OFFSET, link.target.y!],
    })
  }
  return createLinkHorizontal({
    source: [link.source.x! + NODE_WIDTH / 2 - NODE_LINK_OFFSET, link.source.y!],
    target: [link.target.x! - NODE_WIDTH / 2 + NODE_LINK_OFFSET, link.target.y!],
  })
}

onMounted(() => {
  handleDragingScroll()

  watch(() => payload.packages, calculateGraph, { immediate: true })

  watch(
    () => query.selected,
    () => {
      if (query.selected)
        focusOn(query.selected)
    },
    { flush: 'post' },
  )
})
</script>

<template>
  <div
    ref="container"
    w-screen h-screen of-scroll absolute inset-0 relative select-none
    flex="~ items-center justify-center"
    :class="isGrabbing ? 'cursor-grabbing' : ''"
  >
    <div class="bg-dots" pointer-events-none z-graph-bg absolute left-0 top-0 :style="{ width: `${width}px`, height: `${height}px` }" />
    <div ref="screenshotTarget" :style="{ minWidth: `${width}px`, minHeight: `${height}px` }">
      <svg ref="svgLinks" pointer-events-none absolute left-0 top-0 z-graph-link :width="width" :height="height">
        <g>
          <path
            v-for="link of [...links, ...additionalLinks]"
            :key="link.id"
            :d="generateLink(link)!"
            fill="none"
            stroke="#8883"
          />
        </g>
      </svg>
      <svg ref="svgLinksActive" pointer-events-none absolute left-0 top-0 z-graph-link-active :width="width" :height="height">
        <g>
          <path
            v-for="link of activeLinks"
            :key="link.id"
            :d="generateLink(link)!"
            fill="none"
            class="stroke-primary:75"
          />
        </g>
      </svg>
      <template
        v-for="node of nodes"
        :key="node.data.spec"
      >
        <template v-if="node.data.spec !== '~root'">
          <GraphNode
            :ref="(el: any) => nodesRefMap.set(node.data.spec, el?.$el)"
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
    <div
      fixed right-4 bottom-4 z-panel-nav flex="~ gap-4 items-center"
      bg-glass rounded-full border border-base shadow
    >
      <button
        w-10 h-10 rounded-full hover:bg-active op50 hover:op100
        flex="~ items-center justify-center"
        title="Download Screenshot as PNG"
        @click="takeScreenshot"
      >
        <div i-ph-download-duotone />
      </button>
    </div>
  </div>
</template>

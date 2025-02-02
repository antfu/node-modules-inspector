<script setup lang="ts">
import type { HierarchyLink, HierarchyNode } from 'd3-hierarchy'
import type { PackageNode } from 'node-modules-tools'
import { useEventListener } from '@vueuse/core'
import { hierarchy, tree } from 'd3-hierarchy'
import { linkHorizontal, linkVertical } from 'd3-shape'
import { computed, nextTick, onMounted, ref, shallowReactive, shallowRef, useTemplateRef, watch } from 'vue'
import { query } from '~/state/query'

const props = defineProps<{
  packages: PackageNode[]
}>()

interface Link extends HierarchyLink<PackageNode> {
  id: string
}

const svgLinks = useTemplateRef<SVGSVGElement>('svgLinks')
const svgLinksActive = useTemplateRef<SVGSVGElement>('svgLinksActive')

const el = useTemplateRef<HTMLDivElement>('el')
const width = ref(window.innerWidth)
const height = ref(window.innerHeight)

const nodes = shallowRef<HierarchyNode<PackageNode>[]>([])
const links = shallowRef<Link[]>([])
const nodesMap = shallowReactive(new Map<string, HierarchyNode<PackageNode>>())
const linksMap = shallowReactive(new Map<string, Link>())

const nodesRefMap = new Map<string, HTMLDivElement>()

const NODE_WIDTH = 400
const NODE_HEIGHT = 30
const NODE_MARGIN = 100

function calculateGraph() {
  const packageMap = new Map<string, PackageNode>(props.packages.map(x => [x.spec, x]))
  const topLevel = Array.from(props.packages.values() || [])
    .filter(pkg => !pkg.flatDependents.size)
    .sort((a, b) => a.flatDependencies.size - b.flatDependencies.size)

  const seen = new Set<PackageNode>()
  const root = hierarchy<PackageNode>(
    { name: '~root', spec: '~root' } as any,
    (d) => {
      if (d.name === '~root') {
        topLevel.forEach(x => seen.add(x))
        return topLevel
      }
      const children = Array.from(d.dependencies)
        .map(i => packageMap.get(i))
        .filter(x => !!x)
        .filter(x => !seen.has(x))
        .sort((a, b) => a.flatDependencies.size - b.flatDependencies.size)
      children.forEach(x => seen.add(x))
      return children
    },
  )

  // Calculate the layout
  const layout = tree<PackageNode>()
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
}

function handleDragingScroll() {
  let isDown = false
  let x = 0
  let y = 0
  useEventListener(el, 'mousedown', (e) => {
    if (Array.from(e.composedPath()).some(x => (x as HTMLDivElement).tagName?.toLowerCase() === 'button'))
      return
    isDown = true
    x = el.value!.scrollLeft + e.offsetX
    y = el.value!.scrollTop + e.offsetY
  })
  useEventListener(el, 'mouseleave', () => isDown = false)
  useEventListener(el, 'mouseup', () => isDown = false)
  useEventListener(el, 'mousemove', (e) => {
    if (!isDown)
      return
    e.preventDefault()
    el.value!.scrollLeft = x - e.offsetX
    el.value!.scrollTop = y - e.offsetY
  })
}

onMounted(() => {
  handleDragingScroll()

  watch(() => props.packages, calculateGraph, { immediate: true })

  nextTick(() => {
    width.value = el.value!.scrollWidth
    height.value = el.value!.scrollHeight

    watch(
      () => query.selected,
      () => {
        if (query.selected)
          focusOn(query.selected)
      },
      { immediate: true, flush: 'post' },
    )
  })
})

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
    ...links.value.filter((link) => {
      return getSelectionMode(link.source.data) === 'selected' && getSelectionMode(link.target.data) === 'selected'
    }),
    ...additionalLinks.value,
  ]
})

function focusOn(spec: string) {
  const el = nodesRefMap.get(spec)
  el?.scrollIntoView({
    block: 'center',
    inline: 'center',
    behavior: 'smooth',
  })
}

function getSelectionMode(node: PackageNode) {
  if (!query.selected || query.selected.startsWith('~'))
    return 'none'
  if (node.spec === query.selected || node.flatDependencies.has(query.selected) || node.flatDependents.has(query.selected))
    return 'selected'
  return 'faded'
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
      source: [link.source.x! + NODE_WIDTH / 2 - 20, link.source.y!],
      target: [link.target.x! - NODE_WIDTH / 2 + 20, link.target.y!],
    })
  }
  return createLinkHorizontal({
    source: [link.source.x! + NODE_WIDTH / 2 - 20, link.source.y!],
    target: [link.target.x! - NODE_WIDTH / 2 + 20, link.target.y!],
  })
}
</script>

<template>
  <div
    ref="el"
    w-screen h-screen of-scroll absolute inset-0 relative select-none
    flex="~ items-center justify-center"
  >
    <div class="bg-dots" pointer-events-none z-graph-bg absolute left-0 top-0 :style="{ width: `${width}px`, height: `${height}px` }" />
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
        <PackageInfoNode
          :ref="(el: any) => nodesRefMap.set(node.data.spec, el?.$el)"
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

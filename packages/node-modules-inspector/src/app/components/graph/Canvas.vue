<script setup lang="ts">
import type { HierarchyLink, HierarchyNode } from 'd3-hierarchy'
import type { PackageNode } from 'node-modules-tools'
import type { HighlightMode } from '../../state/highlight'
import type { ComputedPayload } from '../../state/payload'
import type { GraphvizLayoutRequest, GraphvizLayoutResponse } from '../../utils/graphviz-worker'
import { onKeyPressed, useEventListener, useMagicKeys } from '@vueuse/core'
import { hierarchy, tree } from 'd3-hierarchy'
import { linkHorizontal, linkVertical } from 'd3-shape'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, shallowReactive, shallowRef, useTemplateRef, watch } from 'vue'
import { useZoomElement } from '../../composables/zoomElement'
import { selectedNode } from '../../state/current'
import { getCompareHighlight } from '../../state/highlight'
import { payloads } from '../../state/payload'
import { query } from '../../state/query'
import { settings } from '../../state/settings'
import GraphDot from './Dot.vue'
import GraphNode from './Node.vue'

const { payload, rootPackages, highlightMode } = defineProps<{
  payload: ComputedPayload
  rootPackages: PackageNode[]
  highlightMode?: HighlightMode
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

const ZOOM_MIN = 0.4
const ZOOM_MAX = 2
const { control } = useMagicKeys()
const { scale, zoomIn, zoomOut } = useZoomElement(container, {
  wheel: control,
  minScale: ZOOM_MIN,
  maxScale: ZOOM_MAX,
})

onKeyPressed(['-', '_'], (e) => {
  if (e.ctrlKey)
    zoomOut()
})

onKeyPressed(['=', '+'], (e) => {
  if (e.ctrlKey)
    zoomIn()
})

const nodesRefMap = new Map<string, HTMLDivElement>()

const SPACING = reactive({
  width: computed(() => settings.value.graphRender === 'normal' ? 300 : 16),
  height: computed(() => settings.value.graphRender === 'normal' ? 30 : 16),
  linkOffset: computed(() => settings.value.graphRender === 'normal' ? 20 : 0),
  margin: computed(() => 800),
  gap: computed(() => settings.value.graphRender === 'normal' ? 150 : 100),
  // Gaps between nodes for the layered DAG layout
  gapX: computed(() => settings.value.graphRender === 'normal' ? 100 : 60),
  gapY: computed(() => settings.value.graphRender === 'normal' ? 12 : 8),
})

// Measured sizes of the rendered nodes, keyed by package spec
const nodeSizes = new Map<string, readonly [width: number, height: number]>()

function nodeWidth(spec: string) {
  return nodeSizes.get(spec)?.[0] ?? SPACING.width
}

// The Graphviz layout runs in a Web Worker, as it can take a while on large graphs
let graphvizWorker: Worker | undefined
let graphvizRequestId = 0

interface GraphvizJson {
  bb?: string
  objects?: { name: string, pos?: string }[]
}

function runGraphvizLayout(dot: string): Promise<GraphvizJson> {
  graphvizWorker ||= new Worker(
    new URL('../../utils/graphviz-worker.ts', import.meta.url),
    { type: 'module' },
  )
  const worker = graphvizWorker
  const id = ++graphvizRequestId
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<GraphvizLayoutResponse>) => {
      if (event.data.id !== id)
        return
      worker.removeEventListener('message', onMessage)
      if (event.data.error != null)
        reject(new Error(event.data.error))
      else
        resolve(JSON.parse(event.data.json!))
    }
    worker.addEventListener('message', onMessage)
    worker.postMessage({ id, dot } satisfies GraphvizLayoutRequest)
  })
}

function dotEscape(id: string) {
  return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// Graphviz sizes are given in inches (72pt each); we treat 1pt as 1px
const PX_PER_INCH = 72

/**
 * Refine node positions with Graphviz's `dot` layered layout
 * (adapted from npmgraph's node allocation).
 *
 * Unlike the provisional tidy-tree layout, this considers every edge of the
 * dependency DAG (not only the rendered spanning tree) and shrink-wraps nodes
 * to their measured sizes, producing a much more compact graph.
 */
async function layoutDag(_nodes: HierarchyNode<PackageNode>[]) {
  const pkgNodes = _nodes.filter(n => n.data.spec !== '~root')
  if (!pkgNodes.length)
    return undefined

  // Measure the rendered node sizes, so that the layout can shrink-wrap them
  nodeSizes.clear()
  for (const node of pkgNodes) {
    const el = nodesRefMap.get(node.data.spec)
    nodeSizes.set(node.data.spec, el?.offsetWidth
      ? [el.offsetWidth, el.offsetHeight]
      : [SPACING.width, SPACING.height])
  }

  const lines: string[] = [
    'digraph {',
    'rankdir="LR"',
    // We only take the node positions, so skip the edge routing entirely
    'splines=none',
    `ranksep=${(SPACING.gapX / PX_PER_INCH).toFixed(4)}`,
    `nodesep=${(SPACING.gapY / PX_PER_INCH).toFixed(4)}`,
    'node [shape=box fixedsize=true label=""]',
  ]

  for (const node of pkgNodes) {
    const [w, h] = nodeSizes.get(node.data.spec)!
    lines.push(`"${dotEscape(node.data.spec)}" [width=${(w / PX_PER_INCH).toFixed(4)} height=${(h / PX_PER_INCH).toFixed(4)}]`)
  }

  // Feed the full DAG (not only the rendered spanning tree) to the layout
  for (const node of pkgNodes) {
    for (const dep of payload.dependencies(node.data)) {
      if (dep.spec !== node.data.spec)
        lines.push(`"${dotEscape(node.data.spec)}" -> "${dotEscape(dep.spec)}"`)
    }
  }

  lines.push('}')

  const json = await runGraphvizLayout(lines.join('\n'))

  // Graphviz positions are node centers in points, with the origin at the
  // bottom-left corner — flip the y axis
  const bbHeight = Number(json.bb?.split(',')[3] ?? 0)
  const positions = new Map<string, readonly [number, number]>()
  for (const object of json.objects ?? []) {
    if (!object.pos)
      continue
    const [x = 0, y = 0] = object.pos.split(',').map(Number)
    positions.set(object.name, [x, bbHeight - y] as const)
  }
  return positions
}

onUnmounted(() => {
  graphvizWorker?.terminate()
  graphvizWorker = undefined
})

// Offset the graph to leave a margin around it
function applyGraphOffset(_nodes: HierarchyNode<PackageNode>[]) {
  const minX = Math.min(..._nodes.map(n => n.x!))
  const minY = Math.min(..._nodes.map(n => n.y!))
  for (const node of _nodes) {
    node.x! += SPACING.margin - minX
    node.y! += SPACING.margin - minY
  }
}

let layoutGeneration = 0

async function calculateGraph() {
  const generation = ++layoutGeneration

  // Unset the canvas size, and recalculate again after nodes are rendered
  width.value = window.innerWidth
  height.value = window.innerHeight

  const seen = new Set<PackageNode>()
  const root = hierarchy<PackageNode>(
    { name: '~root', spec: '~root' } as any,
    (node) => {
      if (node.name === '~root') {
        rootPackages.forEach(x => seen.add(x))
        return rootPackages
      }
      const children = payload.dependencies(node)
        .filter(x => !seen.has(x))
        .sort((a, b) => a.depth - b.depth || payload.flatDependencies(b).length - payload.flatDependencies(a).length)
      children.forEach(x => seen.add(x))
      return children
    },
  )

  // Calculate a provisional tidy-tree layout, so that nodes can be rendered
  // and measured right away (also the fallback if the DAG layout fails)
  const layout = tree<PackageNode>()
    .nodeSize([SPACING.height, SPACING.width + SPACING.gap])
  layout(root)

  // Rotate the graph from top-down to left-right
  const _nodes = root.descendants()
  for (const node of _nodes) {
    [node.x, node.y] = [node.y! - SPACING.width, node.x!]
  }

  applyGraphOffset(_nodes)

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

  // Add additional links from root packages
  for (const pkg of rootPackages) {
    for (const dep of payload.dependencies(pkg)) {
      if (rootPackages.includes(dep))
        continue
      const id = `${pkg.spec}|${dep.spec}`
      if (!linksMap.has(id)) {
        const source = nodesMap.get(pkg.spec)!
        const target = nodesMap.get(dep.spec)!
        const link: Link = { id, source, target }
        linksMap.set(id, link)
        _links.push(link)
      }
    }
  }

  links.value = _links

  // Wait for the nodes to render, then refine the positions with the DAG layout
  await nextTick()
  if (generation !== layoutGeneration)
    return

  try {
    const positions = await layoutDag(_nodes)
    if (generation !== layoutGeneration)
      return
    if (positions) {
      for (const node of _nodes) {
        const pos = positions.get(node.data.spec)
        if (pos)
          [node.x, node.y] = pos
      }
      applyGraphOffset(_nodes)
      // Reassign to trigger a re-render with the updated positions
      nodes.value = [..._nodes]
      links.value = [..._links]
    }
  }
  catch (error) {
    console.error('[node-modules-inspector] Failed to calculate the DAG layout, falling back to the tree layout', error)
  }

  await nextTick()
  if (generation !== layoutGeneration)
    return

  width.value = (container.value!.scrollWidth / scale.value + SPACING.margin)
  height.value = (container.value!.scrollHeight / scale.value + SPACING.margin)

  if (query.selected)
    focusOn(query.selected, false)
  else if (payload.packages[0])
    focusOn(payload.packages[0].spec, false)
}

const isGrabbing = shallowRef(false)
function handleDragingScroll() {
  let x = 0
  let y = 0
  const SCROLLBAR_THICKNESS = 20

  useEventListener(container, 'mousedown', (e) => {
    // prevent dragging when clicking on scrollbar
    const rect = container.value!.getBoundingClientRect()
    const distRight = rect.right - e.clientX
    const distBottom = rect.bottom - e.clientY
    if (distRight <= SCROLLBAR_THICKNESS || distBottom <= SCROLLBAR_THICKNESS) {
      return
    }

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
  return selectedNode.value === pkg || payloads.available.flatDependencies(selectedNode.value).includes(pkg) || payloads.available.flatDependents(selectedNode.value).includes(pkg)
}

const createLinkHorizontal = linkHorizontal()
  .x(d => d[0])
  .y(d => d[1])

const createLinkVertical = linkVertical()
  .x(d => d[0])
  .y(d => d[1])

function generateLink(link: HierarchyLink<PackageNode>) {
  const source: [number, number] = [
    link.source.x! + nodeWidth(link.source.data.spec) / 2 - SPACING.linkOffset,
    link.source.y!,
  ]
  const target: [number, number] = [
    link.target.x! - nodeWidth(link.target.data.spec) / 2 + SPACING.linkOffset,
    link.target.y!,
  ]
  if (link.target.x! <= link.source.x!)
    return createLinkVertical({ source, target })
  return createLinkHorizontal({ source, target })
}

function getLinkColor(link: Link) {
  if (!highlightMode)
    return 'stroke-#8882'

  const source = getCompareHighlight(link.source.data)
  const target = getCompareHighlight(link.target.data)

  const set = new Set([source, target])
  if (set.size === 2 && set.has('both'))
    set.delete('both')

  if (set.size === 1) {
    if (set.has('a'))
      return 'stroke-yellow5:30'
    if (set.has('b'))
      return 'stroke-purple5:30'
    if (set.has('both'))
      return 'stroke-pink5:30'
  }
  return 'stroke-#8882'
}

function toggleRender() {
  settings.value.graphRender = settings.value.graphRender === 'normal' ? 'dots' : 'normal'
}

onMounted(() => {
  handleDragingScroll()

  watch(
    () => [payload.packages, settings.value.graphRender],
    calculateGraph,
    { immediate: true },
  )

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
    w-screen h-screen of-scroll relative select-none
    :class="isGrabbing ? 'cursor-grabbing' : ''"
  >
    <div
      flex="~ items-center justify-center"
      :style="{ transform: `scale(${scale})`, transformOrigin: '0 0' }"
    >
      <div class="bg-dots" pointer-events-none z-graph-bg absolute left-0 top-0 :style="{ width: `${width}px`, height: `${height}px` }" />
      <div ref="screenshotTarget" :style="{ minWidth: `${width * scale}px`, minHeight: `${height * scale}px` }">
        <svg ref="svgLinks" pointer-events-none absolute left-0 top-0 z-graph-link :width="width" :height="height" data-a11y-skip>
          <g>
            <path
              v-for="link of [...links, ...additionalLinks]"
              :key="link.id"
              :d="generateLink(link)!"
              :class="getLinkColor(link)"
              fill="none"
            />
          </g>
        </svg>
        <svg ref="svgLinksActive" pointer-events-none absolute left-0 top-0 z-graph-link-active :width="width" :height="height" data-a11y-skip>
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
            <component
              :is="settings.graphRender === 'normal' ? GraphNode : GraphDot"
              :ref="(el: any) => nodesRefMap.set(node.data.spec, el?.$el)"
              :pkg="node.data"
              :highlight-mode="highlightMode"
              :style="{
                left: `${node.x}px`,
                top: `${node.y}px`,
              }"
            />
          </template>
        </template>
      </div>
    </div>

    <div
      fixed right-4 bottom-4 z-panel-nav flex="~ col gap-2 items-center"
    >
      <div w-10 flex="~ items-center justify-center">
        <UiTimeoutView :content="`${Math.round(scale * 100)}%`" class="text-sm" />
      </div>

      <div bg-glass rounded-full border border-base shadow>
        <button
          v-tooltip.left="'Zoom In (Ctrl + =)'"
          :disabled="scale >= ZOOM_MAX"
          w-10 h-10 rounded-full hover:bg-hover op-fade
          hover:op100 disabled:op20 disabled:bg-none
          disabled:cursor-not-allowed
          flex="~ items-center justify-center"
          title="Zoom In (Ctrl + =)"
          @click="zoomIn()"
        >
          <div i-ph-magnifying-glass-plus-duotone />
        </button>
        <button
          v-tooltip.left="'Zoom Out (Ctrl + -)'"
          :disabled="scale <= ZOOM_MIN"
          w-10 h-10 rounded-full hover:bg-hover op-fade hover:op100
          disabled:op20 disabled:bg-none disabled:cursor-not-allowed
          flex="~ items-center justify-center"
          title="Zoom Out (Ctrl + -)"
          @click="zoomOut()"
        >
          <div i-ph-magnifying-glass-minus-duotone />
        </button>
      </div>

      <div bg-glass rounded-full border border-base shadow>
        <button
          v-tooltip.left="'Toggle Graph Render Mode'"
          w-10 h-10 rounded-full hover:bg-hover op-fade hover:op100
          flex="~ items-center justify-center"
          title="Toggle Graph Render Mode"
          @click="toggleRender"
        >
          <div v-if="settings.graphRender === 'dots'" i-ph-dots-nine-duotone />
          <div v-else i-ph-dresser-duotone />
        </button>
      </div>

      <div bg-glass rounded-full border border-base shadow>
        <button
          v-tooltip.left="'Download Screenshot as PNG'"
          w-10 h-10 rounded-full hover:bg-hover op-fade hover:op100
          flex="~ items-center justify-center"
          title="Download Screenshot as PNG"
          @click="takeScreenshot"
        >
          <div i-ph-download-duotone />
        </button>
      </div>
    </div>
  </div>
</template>

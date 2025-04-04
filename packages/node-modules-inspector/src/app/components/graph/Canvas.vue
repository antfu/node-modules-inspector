<script setup lang="ts">
import type { HierarchyLink, HierarchyNode } from 'd3-hierarchy'
import type { PackageNode } from 'node-modules-tools'
import type { HighlightMode } from '../../state/highlight'
import type { ComputedPayload } from '../../state/payload'
import { onKeyPressed, useEventListener, useMagicKeys } from '@vueuse/core'
import { hierarchy, tree } from 'd3-hierarchy'
import { linkHorizontal, linkVertical } from 'd3-shape'
import { computed, nextTick, onMounted, reactive, ref, shallowReactive, shallowRef, useTemplateRef, watch } from 'vue'
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
  width: computed(() => settings.value.graphRender === 'normal' ? 300 : 10),
  height: computed(() => settings.value.graphRender === 'normal' ? 30 : 20),
  linkOffset: computed(() => settings.value.graphRender === 'normal' ? 20 : 0),
  margin: computed(() => 800),
  gap: computed(() => settings.value.graphRender === 'normal' ? 150 : 100),
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

  // Calculate the layout
  const layout = tree<PackageNode>()
    .nodeSize([SPACING.height, SPACING.width + SPACING.gap])
  layout(root)

  // Rotate the graph from top-down to left-right
  const _nodes = root.descendants()
  for (const node of _nodes) {
    [node.x, node.y] = [node.y! - SPACING.width, node.x!]
  }

  // Offset the graph and adding margin
  const minX = Math.min(..._nodes.map(n => n.x!))
  const minY = Math.min(..._nodes.map(n => n.y!))
  if (minX < SPACING.margin) {
    for (const node of _nodes) {
      node.x! += Math.abs(minX) + SPACING.margin
    }
  }
  if (minY < SPACING.margin) {
    for (const node of _nodes) {
      node.y! += Math.abs(minY) + SPACING.margin
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

  nextTick(() => {
    width.value = (container.value!.scrollWidth / scale.value + SPACING.margin)
    height.value = (container.value!.scrollHeight / scale.value + SPACING.margin)

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
      source: [link.source.x! + SPACING.width / 2 - SPACING.linkOffset, link.source.y!],
      target: [link.target.x! - SPACING.width / 2 + SPACING.linkOffset, link.target.y!],
    })
  }
  return createLinkHorizontal({
    source: [link.source.x! + SPACING.width / 2 - SPACING.linkOffset, link.source.y!],
    target: [link.target.x! - SPACING.width / 2 + SPACING.linkOffset, link.target.y!],
  })
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
        <svg ref="svgLinks" pointer-events-none absolute left-0 top-0 z-graph-link :width="width" :height="height">
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
            <component
              :is="settings.graphRender === 'normal' ? GraphNode : GraphDot"
              :ref="(el: any) => nodesRefMap.set(node.data.spec, el?.$el)"
              :pkg="node.data"
              :highlight-mode="highlightMode"
              :style="{
                left: `${node.x}px`,
                top: `${node.y}px`,
                minWidth: settings.graphRender === 'normal' ? `${SPACING.width}px` : undefined,
              }"
            />
          </template>
        </template>
      </div>
    </div>

    <div
      fixed right-4 bottom-4 z-panel-nav flex="~ col gap-4 items-center"
    >
      <div w-10 flex="~ items-center justify-center">
        <UiTimeoutView :content="`${Math.round(scale * 100)}%`" class="text-sm" />
      </div>

      <div bg-glass rounded-full border border-base shadow>
        <button
          v-tooltip="'Zoom In (Ctrl + =)'"
          :disabled="scale >= ZOOM_MAX"
          w-10 h-10 rounded-full hover:bg-active op-fade
          hover:op100 disabled:op20 disabled:bg-none
          disabled:cursor-not-allowed
          flex="~ items-center justify-center"
          title="Zoom In (Ctrl + =)"
          @click="zoomIn()"
        >
          <div i-ph-magnifying-glass-plus-duotone />
        </button>
        <button
          v-tooltip="'Zoom Out (Ctrl + -)'"
          :disabled="scale <= ZOOM_MIN"
          w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
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
          v-tooltip="'Toggle Graph Render Mode'"
          w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
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
          v-tooltip="'Download Screenshot as PNG'"
          w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
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

<script setup lang="ts">
import type { GraphBase, GraphBaseOptions } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import type { ChartNode } from '../../types/chart'
import { useRoute } from '#app/composables/router'
import { selectedNode } from '@/state/current'
import { useMouse } from '@vueuse/core'
import { createColorGetterSpectrum, createFlamegraph, createSunburst, createTreemap } from 'nanovis'
import { computed, nextTick, onUnmounted, reactive, shallowRef, useTemplateRef, watch } from 'vue'
import { isDark } from '../../composables/dark'
import { payloads } from '../../state/payload'
import { settings } from '../../state/settings'
import { bytesToHumanSize } from '../../utils/format'
import { getModuleType } from '../../utils/module-type'

const mouse = reactive(useMouse())
const params = useRoute().params as Record<string, string>
const chart = computed<'frame' | 'treemap' | 'sunburst'>(() => params.chart[0] as any || 'treemap')
const nodeHover = shallowRef<ChartNode | undefined>(undefined)
const nodeSelected = shallowRef<ChartNode | undefined>(undefined)

const root = computed(() => {
  const packages = payloads.filtered.packages
  const rootDepth = Math.min(...packages.map(i => i.depth))
  const map = new Map<PackageNode, ChartNode>()

  let maxDepth = 0

  const root: ChartNode = {
    id: 'root',
    text: 'Root',
    size: 0,
    children: [],
  }

  // We scan BFS to make more reasonable chunks
  const tasks: (() => void)[] = []
  const macrosTasks: (() => void)[] = []

  macrosTasks.unshift(() => {
    root.size += root.children.reduce((acc, i) => acc + i.size, 0)
    root.subtext = bytesToHumanSize(root.size).join(' ')
    root.children.sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
  })

  function pkgToNode(pkg: PackageNode, parent: ChartNode | undefined, depth: number): ChartNode {
    if (depth > maxDepth)
      maxDepth = depth

    const node: ChartNode = {
      id: pkg.spec,
      text: pkg.name,
      size: pkg.resolved.installSize?.bytes || 0,
      children: [],
      meta: pkg,
      parent,
    }
    map.set(pkg, node)
    const validChildren = payloads.filtered.dependencies(pkg)
      .filter(i => !map.has(i))

    tasks.push(() => {
      node.children = validChildren
        .filter(i => !map.has(i))
        .map(pkg => pkgToNode(pkg, node, depth + 1))
    })

    macrosTasks.unshift(() => {
      const selfSize = node.size
      node.size += node.children.reduce((acc, i) => acc + i.size, 0)
      if (node.children.length && selfSize / node.size > 0.3) {
        node.children.push({
          id: `${node.id}-self`,
          text: '',
          size: selfSize,
          subtext: bytesToHumanSize(selfSize).join(' '),
          children: [],
          meta: node.meta,
          parent: node,
        })
      }
      node.subtext = bytesToHumanSize(node.size).join(' ')
      node.children.sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
    })

    return node
  }

  root.children = packages
    .filter(i => i.depth === rootDepth)
    .map(pkg => pkgToNode(pkg, root, 1))

  function runTasks() {
    const clone = [...tasks]
    tasks.length = 0
    clone.forEach(fn => fn())
    if (tasks.length)
      runTasks()
  }

  runTasks()
  macrosTasks.forEach(fn => fn())

  return {
    map,
    root,
    maxDepth,
  }
})

const el = useTemplateRef('el')
let dispose: () => void | undefined

const options = computed<GraphBaseOptions<PackageNode | undefined>>(() => {
  return {
    onClick(node) {
      if (node)
        nodeHover.value = node
      if (node.meta)
        selectedNode.value = node.meta
    },
    onHover(node) {
      if (node)
        nodeHover.value = node
    },
    onLeave() {
      nodeHover.value = undefined
    },
    onSelect(node) {
      nodeSelected.value = node || undefined
      selectedNode.value = node?.meta
    },
    palette: {
      stroke: isDark.value ? '#222' : '#555',
      fg: isDark.value ? '#fff' : '#000',
      bg: isDark.value ? '#111' : '#fff',
    },
    getColor: settings.value.chartColoringMode === 'module'
      ? (node) => {
          if (!node.meta)
            return undefined
          const type = getModuleType(node.meta?.resolved.module)
          switch (type) {
            case 'esm':
              return '#4ade80'
            case 'cjs':
              return '#facc15'
            case 'dual':
              return '#2dd4bf'
            case 'faux':
              return '#a3e635'
            case 'dts':
              return '#888888'
          }
        }
      : createColorGetterSpectrum(
          root.value,
          isDark.value ? 0.8 : 0.9,
          isDark.value ? 1 : 1.1,
        ),
    getSubtext: (node) => {
      if (!node.meta)
        return node.subtext
      if (settings.value.chartColoringMode === 'module') {
        const type = getModuleType(node.meta?.resolved.module)
        return type.toUpperCase()
      }
      return node.subtext
    },
  }
})

let graph: GraphBase<PackageNode | undefined> | undefined

watch(
  () => [el.value, chart.value, root.value, options.value],
  () => {
    dispose?.()
    if (!el.value)
      return

    const createGraph = chart.value === 'sunburst'
      ? createSunburst
      : chart.value === 'frame'
        ? createFlamegraph
        : createTreemap
    nodeSelected.value = root.value.root
    graph = createGraph(root.value, options.value)
    el.value!.append(graph.el)

    nextTick(() => {
      const selected = selectedNode.value ? root.value.map.get(selectedNode.value) || null : null
      if (chart.value === 'sunburst')
        graph?.select(selected)
      else if (chart.value === 'treemap')
        graph?.select((selected?.children.length ? selected : selected?.parent) || null)
    })

    dispose = () => graph?.dispose()
  },
  {
    deep: true,
    immediate: true,
  },
)

watch(
  () => settings.value.chartColoringMode,
  () => {
    graph?.draw()
  },
)

watch(
  () => settings.value.collapseSidepanel,
  () => {
    const start = Date.now()
    const run = () => {
      graph?.resize()
      if (graph && Date.now() - start < 3000)
        requestAnimationFrame(run)
    }
    requestAnimationFrame(run)
  },
  {
    immediate: true,
  },
)

const containerClass = computed(() => chart.value === 'sunburst' ? 'grid grid-cols-[500px_1fr]' : '')

onUnmounted(() => {
  dispose?.()
})
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <NuxtLink btn-action as="button" to="/chart/treemap" active-class="text-primary bg-primary:5">
      <div i-ph-checkerboard-duotone />
      Treemap
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/chart/sunburst" active-class="text-primary bg-primary:5">
      <div i-ph-chart-donut-duotone />
      Sunburst
    </NuxtLink>
    <NuxtLink btn-action as="button" to="/chart/frame" active-class="text-primary bg-primary:5">
      <div i-ph-chart-bar-horizontal-duotone />
      Framegraph
    </NuxtLink>

    <div flex-auto />
    <OptionSelectGroup
      v-model="settings.chartColoringMode"
      v-tooltip="`Color Mode`"
      :options="['spectrum', 'module']"
      :titles="['Spectrum', 'Module']"
    />
  </div>
  <div :class="containerClass" mt5>
    <div ref="el" />
    <ChartSunburstSide
      v-if="chart === 'sunburst'"
      :options="options"
      :selected="nodeSelected"
      @select="x => graph?.select(x)"
    />
  </div>
  <div
    v-if="nodeHover?.meta"
    bg-glass fixed z-panel-nav border="~ base rounded" p2 text-sm
    flex="~ col gap-2"
    :style="{
      left: `${mouse.x + 10}px`,
      top: `${mouse.y + 10}px`,
    }"
  >
    <div flex="~ gap-1 items-center">
      <DisplayPackageSpec :pkg="nodeHover.meta" text-base />
      <DisplayModuleType :pkg="nodeHover.meta" />
    </div>
    <div flex="~ gap-1 items-center">
      <DisplayFileSizeBadge :bytes="nodeHover.meta.resolved.installSize?.bytes" :percent="false" />
      <template v-if="nodeHover.meta.resolved.installSize?.bytes !== nodeHover.size">
        <span op50>/</span>
        <DisplayFileSizeBadge :bytes="nodeHover.size" :percent="false" />
      </template>
    </div>
  </div>
</template>

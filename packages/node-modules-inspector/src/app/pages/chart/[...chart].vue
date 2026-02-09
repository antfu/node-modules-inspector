<script setup lang="ts">
import type { GraphBase, GraphBaseOptions } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import type { ChartNode } from '../../types/chart'
import { useRoute } from '#app/composables/router'
import { partition } from '@antfu/utils'
import { useMouse } from '@vueuse/core'
import { createColorGetterSpectrum, Flamegraph, Sunburst, Treemap } from 'nanovis'
import { computed, nextTick, onUnmounted, reactive, shallowRef, watch } from 'vue'
import { isDark } from '../../composables/dark'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import { settings } from '../../state/settings'
import { isSidepanelCollapsed } from '../../state/ui'
import { bytesToHumanSize } from '../../utils/format'
import { getModuleType } from '../../utils/module-type'

const mouse = reactive(useMouse())
const params = useRoute().params as Record<string, string>
const chart = computed<'flamegraph' | 'treemap' | 'sunburst'>(() => params.chart?.[0] as any || 'treemap')
const nodeHover = shallowRef<ChartNode | undefined>(undefined)
const nodeSelected = shallowRef<ChartNode | undefined>(undefined)
const location = window.location

const tree = computed(() => {
  const packages = payloads.filtered.packages
  const rootDepth = Math.min(...packages.map(i => i.depth))
  const map = new Map<PackageNode, ChartNode>()

  let maxDepth = 0

  const root: ChartNode = {
    id: '~root',
    text: 'Project',
    size: 0,
    sizeSelf: 0,
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

  function pkgToNode(pkg: PackageNode, parent: ChartNode | undefined, depth: number): ChartNode | undefined {
    if (map.has(pkg))
      return undefined

    if (depth > maxDepth)
      maxDepth = depth

    const node: ChartNode = {
      id: pkg.spec,
      text: pkg.name,
      sizeSelf: pkg.resolved.installSize?.bytes || 0,
      size: pkg.resolved.installSize?.bytes || 0,
      children: [],
      meta: pkg,
      parent,
    }
    map.set(pkg, node)
    const validChildren = payloads.filtered.dependencies(pkg)
      .filter(i => !map.has(i))

    const [
      shallowest,
      others,
    ] = partition(validChildren, i => i.shallowestDependent?.has(pkg.spec))

    // Shallowest dependencies goes first
    tasks.unshift(() => {
      node.children.push(
        ...shallowest
          .map(pkg => pkgToNode(pkg, node, depth + 1))
          .filter(x => !!x),
      )
    })

    // Other dependencies goes last
    tasks.push(() => {
      node.children.push(
        ...others
          .map(pkg => pkgToNode(pkg, node, depth + 1))
          .filter(x => !!x),
      )
    })

    macrosTasks.unshift(() => {
      const selfSize = node.size
      node.size += node.children.reduce((acc, i) => acc + i.size, 0)
      node.subtext = bytesToHumanSize(node.size).join(' ')

      // If the node itself is more than 10% of the total size, we add a self node to make it more visible
      if (node.children.length && selfSize / node.size > 0.1) {
        node.children.push({
          id: `${node.id}-self`,
          text: '',
          size: selfSize,
          sizeSelf: selfSize,
          subtext: bytesToHumanSize(selfSize).join(' '),
          children: [],
          meta: node.meta,
          parent: node,
        })
      }

      node.children.sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
    })

    return node
  }

  root.children = packages
    .filter(i => i.depth === rootDepth)
    .map(pkg => pkgToNode(pkg, root, 1))
    .filter(x => !!x)

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
    animate: settings.value.chartAnimation,
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
          tree.value.root,
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

const graph = shallowRef<GraphBase<PackageNode | undefined, GraphBaseOptions<PackageNode | undefined>> | undefined>(undefined)

function selectNode(node: ChartNode | null, animate?: boolean) {
  selectedNode.value = node?.meta
  if (!node?.children.length)
    node = node?.parent || null
  graph.value?.select(node, animate)
}

watch(
  () => [chart.value, tree.value, options.value],
  () => {
    dispose?.()

    nodeSelected.value = tree.value.root
    switch (chart.value) {
      case 'sunburst':
        graph.value = new Sunburst(tree.value.root, options.value)
        break
      case 'flamegraph':
        graph.value = new Flamegraph(tree.value.root, options.value)
        break
      default:
        graph.value = new Treemap(tree.value.root, {
          ...options.value,
          selectedPaddingRatio: 0,
        })
    }

    nextTick(() => {
      const selected = selectedNode.value ? tree.value.map.get(selectedNode.value) || null : null
      if (selected)
        selectNode(selected, false)
    })

    dispose = () => {
      graph.value?.dispose()
      graph.value = undefined
    }
  },
  {
    deep: true,
    immediate: true,
  },
)

watch(
  () => settings.value.chartColoringMode,
  () => {
    graph.value?.draw()
  },
)

watch(
  () => isSidepanelCollapsed.value,
  () => {
    const start = Date.now()
    const run = () => {
      graph.value?.resize()
      if (graph.value && Date.now() - start < 3000)
        requestAnimationFrame(run)
    }
    requestAnimationFrame(run)
  },
  {
    immediate: true,
  },
)

onUnmounted(() => {
  dispose?.()
})
</script>

<template>
  <div flex="~ gap-2 items-center wrap">
    <NuxtLink
      btn-action as="button"
      :to="{ path: '/chart/treemap', hash: location.hash }"
      active-class="text-primary bg-primary:5"
    >
      <div i-ph-checkerboard-duotone />
      Treemap
    </NuxtLink>
    <NuxtLink
      btn-action as="button"
      :to="{ path: '/chart/sunburst', hash: location.hash }"
      active-class="text-primary bg-primary:5"
    >
      <div i-ph-chart-donut-duotone />
      Sunburst
    </NuxtLink>
    <NuxtLink
      btn-action as="button"
      :to="{ path: '/chart/flamegraph', hash: location.hash }"
      active-class="text-primary bg-primary:5"
    >
      <div i-ph-chart-bar-horizontal-duotone />
      Flamegraph
    </NuxtLink>

    <div flex-auto />
    <OptionSelectGroup
      v-model="settings.chartColoringMode"
      v-tooltip="`Color Mode`"
      :options="['spectrum', 'module']"
      :titles="['Spectrum', 'Module']"
    />
  </div>
  <div mt5>
    <ChartFlamegraph
      v-if="chart === 'flamegraph' && graph"
      :graph="graph"
      :selected="nodeSelected"
      @select="(x: ChartNode | null) => selectNode(x)"
    />
    <ChartTreemap
      v-if="chart === 'treemap' && graph"
      :graph="graph"
      :selected="nodeSelected"
      @select="x => selectNode(x)"
    />
    <ChartSunburst
      v-if="chart === 'sunburst' && graph"
      :graph="graph"
      :selected="nodeSelected"
      @select="x => selectNode(x)"
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
        <span op-fade>/</span>
        <DisplayFileSizeBadge :bytes="nodeHover.size" :percent="false" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GraphBase, GraphBaseOptions } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import type { ChartNode } from '../../types/chart'
import { partition } from '@antfu/utils'
import { useMouse } from '@vueuse/core'
import { createColorGetterSpectrum, Flamegraph, Sunburst, Treemap } from 'nanovis'
import { computed, nextTick, onUnmounted, reactive, shallowRef, watch } from 'vue'
import { useRoute } from '#app/composables/router'
import { NuxtLink } from '#components'
import ChartFlamegraph from '../../components/chart/Flamegraph.vue'
import ChartSunburst from '../../components/chart/Sunburst.vue'
import ChartTreemap from '../../components/chart/Treemap.vue'
import DisplayFileSizeBadge from '../../components/display/FileSizeBadge.vue'
import DisplayModuleType from '../../components/display/ModuleType'
import DisplayPackageSpec from '../../components/display/PackageSpec.vue'
import OptionSelectGroup from '../../components/option/SelectGroup.vue'
import { isDark } from '../../composables/dark'
import { selectedNode } from '../../state/current'
import { getPublishTime, payloads } from '../../state/payload'
import { query } from '../../state/query'
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

type ColoringMode = 'spectrum' | 'module' | 'age' | 'duplicated'
const COLORING_MODES = ['spectrum', 'module', 'age', 'duplicated'] as const

// The coloring mode is persisted in the query string (URL hash) so that it can
// be shared/bookmarked. Default (`spectrum`) is stored as an empty string to
// keep the URL clean.
const coloringMode = computed<ColoringMode>({
  get() {
    return (COLORING_MODES.includes(query.chartColoring as ColoringMode)
      ? query.chartColoring
      : 'spectrum') as ColoringMode
  },
  set(value) {
    query.chartColoring = value === 'spectrum' ? '' : value
  },
})

const baseShade = computed(() => isDark.value ? '#999' : '#eee')

const YEAR = 365 * 24 * 60 * 60 * 1000

// "Published age" coloring: fresh packages stay neutral, then shift towards
// yellow / orange / red the older their published date is.
function getAgeColor(pkg: PackageNode): string {
  const time = getPublishTime(pkg)
  if (!time)
    return baseShade.value
  const age = Date.now() - +time
  if (age < YEAR)
    return baseShade.value
  if (age < 2 * YEAR)
    return '#facc15'
  if (age < 3 * YEAR)
    return '#fb923c'
  return '#ef4444'
}

// Package names that resolve to more than one version.
const duplicatedNames = computed(() =>
  Array.from(payloads.filtered.versions.entries())
    .filter(([, pkgs]) => pkgs.length > 1)
    .map(([name]) => name)
    .sort(),
)

// "Duplicated" coloring: every package name that resolves to more than one
// version gets its own distinct color; all others stay gray.
const duplicatedColors = computed(() => {
  const map = new Map<string, string>()
  const names = duplicatedNames.value
  names.forEach((name, i) => {
    const hue = Math.round((i / Math.max(names.length, 1)) * 360)
    map.set(name, `hsl(${hue}, 70%, ${isDark.value ? 62 : 45}%)`)
  })
  return map
})

// Hovering a package that has multiple versions outlines every block that
// shares its name (i.e. all of its other versions) with a ring. Only the
// Treemap draws it — the other charts don't expose node geometry.
const HIGHLIGHT_COLOR = '#ec4899'
const highlightName = computed(() => {
  const name = nodeHover.value?.meta?.name
  return name && duplicatedColors.value.has(name) ? name : undefined
})

// Legend entries for the current color mode (spectrum has none).
const legend = computed<{ background: string, label: string }[] | undefined>(() => {
  switch (coloringMode.value) {
    case 'module':
      return [
        { background: '#4ade80', label: 'ESM' },
        { background: '#2dd4bf', label: 'Dual' },
        { background: '#facc15', label: 'CJS' },
        { background: '#a3e635', label: 'Faux' },
        { background: baseShade.value, label: 'DTS' },
      ]
    case 'age':
      return [
        { background: baseShade.value, label: '< 1 year' },
        { background: '#facc15', label: '> 1 year' },
        { background: '#fb923c', label: '> 2 years' },
        { background: '#ef4444', label: '> 3 years' },
      ]
    case 'duplicated':
      return [
        { background: 'linear-gradient(90deg, hsl(0,70%,55%), hsl(120,70%,55%), hsl(240,70%,55%))', label: 'Multiple versions' },
        { background: baseShade.value, label: 'Single version' },
      ]
    default:
      return undefined
  }
})

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
  const mode = coloringMode.value
  const spectrum = createColorGetterSpectrum(
    tree.value.root,
    isDark.value ? 0.8 : 0.9,
    isDark.value ? 1 : 1.1,
  )
  const getColor: typeof spectrum = (node) => {
    if (mode === 'spectrum')
      return spectrum(node)
    if (!node.meta)
      return undefined
    switch (mode) {
      case 'module': {
        const type = getModuleType(node.meta.resolved.module)
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
            return baseShade.value
        }
        return undefined
      }
      case 'age':
        return getAgeColor(node.meta)
      case 'duplicated':
        return duplicatedColors.value.get(node.meta.name) ?? baseShade.value
    }
  }

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
      stroke: isDark.value ? '#444' : '#555',
      fg: isDark.value ? '#fff' : '#000',
      bg: isDark.value ? '#111' : '#fff',
    },
    getColor,
    getSubtext: (node) => {
      if (!node.meta)
        return node.subtext
      if (coloringMode.value === 'module') {
        const type = getModuleType(node.meta.resolved.module)
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

// nanovis has no per-node border, so we wrap the Treemap's `draw()` and, after
// it renders, stroke a ring around every block whose package shares the hovered
// name (its other versions). We reuse the Treemap's own layout boxes via the
// (private) `iterateNodeToDraw` generator, so the rings line up exactly.
interface TreemapLayout {
  node: ChartNode
  box: [number, number, number, number]
  children: TreemapLayout[]
}
interface TreemapInternals {
  draw: () => void
  c: CanvasRenderingContext2D
  layers: { base?: TreemapLayout | null, current?: TreemapLayout | null }
  iterateNodeToDraw: (layout: TreemapLayout, culling: number, cullingLayouts: unknown[]) => Iterable<TreemapLayout>
}

function installTreemapHighlight(treemap: Treemap<PackageNode | undefined>): void {
  const tm = treemap as unknown as TreemapInternals
  const original = tm.draw.bind(tm)
  tm.draw = () => {
    original()
    const name = highlightName.value
    const layout = tm.layers.current || tm.layers.base
    if (!name || !layout)
      return
    const ctx = tm.c
    ctx.save()
    ctx.lineWidth = 2
    ctx.strokeStyle = HIGHLIGHT_COLOR
    for (const item of tm.iterateNodeToDraw(layout, 0, [])) {
      if (item.node.meta?.name !== name)
        continue
      const [x, y, w, h] = item.box
      ctx.strokeRect(x + 1, y + 1, Math.max(w - 2, 1), Math.max(h - 2, 1))
    }
    ctx.restore()
  }
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
      default: {
        const treemap = new Treemap(tree.value.root, {
          ...options.value,
          selectedPaddingRatio: 0,
        })
        installTreemapHighlight(treemap)
        graph.value = treemap
      }
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
  () => coloringMode.value,
  () => {
    graph.value?.draw()
  },
)

// Redraw so the Treemap hover ring (see installTreemapHighlight) follows the
// currently highlighted package. A no-op for the other charts.
watch(
  () => highlightName.value,
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
    <!-- Two axe-core-measured contrast fixes on every active tab below:
         `btn-action` always applies `op75`, so `op100!` is needed to stop the
         active color being diluted toward its 5%-tint background; and the
         plain `text-primary` DEFAULT shade is tuned for its own solid swatch,
         not for sitting on that same near-white/near-black tint, so
         `-700`/`dark:-300` (matching `PackageBorder.vue`) replace it. -->
    <NuxtLink
      btn-action as="button"
      :to="{ path: '/chart/treemap', hash: location.hash }"
      active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!"
    >
      <div i-ph-checkerboard-duotone />
      Treemap
    </NuxtLink>
    <NuxtLink
      btn-action as="button"
      :to="{ path: '/chart/sunburst', hash: location.hash }"
      active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!"
    >
      <div i-ph-chart-donut-duotone />
      Sunburst
    </NuxtLink>
    <NuxtLink
      btn-action as="button"
      :to="{ path: '/chart/flamegraph', hash: location.hash }"
      active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!"
    >
      <div i-ph-chart-bar-horizontal-duotone />
      Flamegraph
    </NuxtLink>

    <div flex-auto />
    <div class="flex flex-col gap-2 justify-end">
      <div class="flex items-center gap-2">
        <div class="op-fade text-xs">
          Colorization
        </div>
        <OptionSelectGroup
          v-model="coloringMode"
          v-tooltip="`Color Mode`"
          :options="['spectrum', 'module', 'age', 'duplicated']"
          :titles="['Spectrum', 'Module', 'Published Age', 'Duplicated']"
        />
      </div>
      <div h-6 flex="~ gap-3 items-center wrap justify-end" text-xs op-fade border="~ base rounded" px2 mla>
        <div v-for="item of legend" :key="item.label" flex="~ gap-1.5 items-center">
          <span inline-block h-3 w-3 rounded-sm border="~ base" :style="{ background: item.background }" />
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
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

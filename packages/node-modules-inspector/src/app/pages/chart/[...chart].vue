<script setup lang="ts">
import type { GraphBaseOptions, Tree, TreeNode } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import { useRoute } from '#app/composables/router'
import { selectedNode } from '@/state/current'
import { useMouse } from '@vueuse/core'
import { createColorGetterSpectrum, createFlamegraph, createSunburst, createTreemap } from 'nanovis'
import { computed, onUnmounted, reactive, shallowRef, useTemplateRef, watchEffect } from 'vue'
import { isDark } from '../../composables/dark'
import { payloads } from '../../state/payload'
import { settings } from '../../state/settings'
import { bytesToHumanSize } from '../../utils/format'
import { getModuleType } from '../../utils/module-type'

const mouse = reactive(useMouse())
const params = useRoute().params as Record<string, string>
const chart = computed<'frame' | 'treemap' | 'sunburst'>(() => params.chart[0] as any || 'treemap')
const hoverNode = shallowRef<Node | undefined>(undefined)

type Node = TreeNode<PackageNode | undefined>

const root = computed<Tree<PackageNode | undefined>>(() => {
  const packages = payloads.filtered.packages
  const rootDepth = Math.min(...packages.map(i => i.depth))
  const seen = new Map<string, Node>()

  let maxDepth = 0

  const root: Node = {
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

  function pkgToNode(pkg: PackageNode, parent: Node | undefined, depth: number): Node {
    if (depth > maxDepth)
      maxDepth = depth

    const node: Node = {
      id: pkg.spec,
      text: pkg.name,
      size: pkg.resolved.installSize?.bytes || 0,
      children: [],
      meta: pkg,
      parent,
    }
    seen.set(pkg.spec, node)
    const validChildren = payloads.filtered.dependencies(pkg)
      .filter(i => !seen.has(i.spec))

    tasks.push(() => {
      node.children = validChildren
        .filter(i => !seen.has(i.spec))
        .map(pkg => pkgToNode(pkg, node, depth + 1))
    })

    macrosTasks.unshift(() => {
      node.size += node.children.reduce((acc, i) => acc + i.size, 0)
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
        hoverNode.value = node
      if (node.meta)
        selectedNode.value = node.meta
    },
    onHover(node) {
      if (node)
        hoverNode.value = node
    },
    onLeave() {
      hoverNode.value = undefined
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

watchEffect(() => {
  dispose?.()
  if (!el.value)
    return

  const createGraph = chart.value === 'sunburst'
    ? createSunburst
    : chart.value === 'frame'
      ? createFlamegraph
      : createTreemap

  const map = createGraph(root.value, options.value)
  el.value!.append(map.el)
  dispose = () => map.dispose()
})

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
  <div ref="el" mt5 />
  <div
    v-if="hoverNode?.meta"
    bg-glass fixed z-panel-nav border="~ base rounded" p2 text-sm
    flex="~ col gap-2"
    :style="{
      left: `${mouse.x + 10}px`,
      top: `${mouse.y + 10}px`,
    }"
  >
    <DisplayPackageSpec :pkg="hoverNode.meta" text-base />
    <div flex="~ gap-1 items-center">
      <DisplayFileSizeBadge :bytes="hoverNode.meta.resolved.installSize?.bytes" />
      <span op50>/</span>
      <DisplayFileSizeBadge :bytes="hoverNode.size" />
    </div>
    <DisplayModuleType :pkg="hoverNode.meta" />
  </div>
</template>

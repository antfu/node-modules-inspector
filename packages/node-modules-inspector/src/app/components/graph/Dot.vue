<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { HighlightMode } from '../../state/highlight'
import { selectedNode } from '../../state/current'

defineProps<{
  pkg: PackageNode
  highlightMode?: HighlightMode
}>()
</script>

<template>
  <UiPackageBorder
    :pkg
    outer="graph-dot"
    :fade="true"
    :highlight-mode="highlightMode"
    border-base="border-#8887"
    w-4 h-4 rounded-full
    @click="selectedNode = pkg === selectedNode ? undefined : pkg"
  />
</template>

<style>
.graph-dot {
  --uno: absolute bg-base rounded-full font-mono ws-nowrap border-3;
  transform: translate(-50%, -50%);
}
</style>

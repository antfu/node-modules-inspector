<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { selectedNode } from '../state/current'

defineProps<{
  pkg?: ResolvedPackageNode
  selectionMode: 'none' | 'faded' | 'selected'
}>()

const classOuter = {
  none: 'z-graph-node',
  faded: 'z-graph-node',
  selected: 'z-graph-node-active border-primary!',
}
const classesInner = {
  none: '',
  faded: 'op75',
  selected: 'bg-primary:10',
}
</script>

<template>
  <div
    class="graph-node"
    :class="classOuter[selectionMode]"
  >
    <button
      v-if="pkg"
      class="graph-node-button"
      :class="classesInner[selectionMode]"
      @click="selectedNode = pkg === selectedNode ? null : pkg"
    >
      <span>{{ pkg.name }}</span>
      <span font-mono op50>@{{ pkg.version }}</span>
      <ModuleTypeLabel ml2 text-xs text-right flex-auto :type="pkg.resolved.module" :badge="false" />
    </button>
  </div>
</template>

<style>
.graph-node {
  --uno: absolute bg-base border border-base rounded-xl font-mono ws-nowrap;
  transform: translate(-50%, -50%);
}

.graph-node-button {
  --uno: 'flex items-center rounded-xl w-full px2 hover:bg-active';
}
</style>

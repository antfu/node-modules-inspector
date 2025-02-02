<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { selectedNode } from '../../state/current'
import { settings } from '../../state/settings'

defineProps<{
  pkg?: PackageNode
  selectionMode: 'none' | 'faded' | 'selected'
}>()

const classOuter = {
  none: 'z-graph-node border-base',
  faded: 'z-graph-node border-base',
  selected: 'z-graph-node-active border-primary',
}
const classesInner = {
  none: '',
  faded: 'op65',
  selected: 'bg-primary:10',
}
</script>

<template>
  <div
    class="graph-node"
    :class="[classOuter[selectionMode], selectedNode === pkg ? 'ring-3 ring-primary:25! text-primary-600 dark:text-primary-300' : '']"
  >
    <button
      v-if="pkg"
      class="graph-node-button"
      :class="classesInner[selectionMode]"
      @click="selectedNode = pkg === selectedNode ? null : pkg"
    >
      <span>{{ pkg.name }}</span>
      <span font-mono op50>@{{ pkg.version }}</span>
      <ModuleTypeLabel
        v-if="!settings.moduleTypeHide"
        ml2 text-xs text-right flex-auto :pkg :badge="false"
      />
    </button>
  </div>
</template>

<style>
.graph-node {
  --uno: absolute bg-base border rounded-xl font-mono ws-nowrap;
  transform: translate(-50%, -50%);
}

.graph-node-button {
  --uno: 'flex items-center rounded-xl w-full px2 hover:bg-active';
}
</style>

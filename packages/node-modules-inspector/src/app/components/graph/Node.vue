<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'

const props = defineProps<{
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

const classesOuter = computed(() => {
  return [
    classOuter[props.selectionMode],
    selectedNode.value === props.pkg
      ? 'ring-3 ring-primary:25! text-primary-600 dark:text-primary-300'
      : '',
    props.pkg?.private ? 'border-dashed!' : '',
  ]
})
</script>

<template>
  <div
    class="graph-node"
    :class="classesOuter"
  >
    <button
      v-if="pkg"
      class="graph-node-button"
      :class="classesInner[selectionMode]"
      @click="selectedNode = pkg === selectedNode ? null : pkg"
    >
      <DisplayPackageSpec :pkg />
      <DisplayModuleType ml2 text-xs text-right flex-auto justify-end :pkg :badge="false" />
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

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'

const props = defineProps<{
  pkg?: PackageNode
  selectionMode: 'none' | 'faded' | 'selected'
}>()

const isFocused = computed(() => {
  if (!props.pkg)
    return false
  return filters.focus?.includes(props.pkg.spec) || filters.why?.includes(props.pkg.spec)
})

const classesOuter = computed(() => {
  const list: string[] = []

  if (props.selectionMode === 'selected')
    list.push('z-graph-node-active')
  else
    list.push('z-graph-node')

  if (isFocused.value)
    list.push('border-orange:50')
  else if (props.selectionMode === 'selected')
    list.push('border-primary')
  else
    list.push('border-base')

  if (selectedNode.value === props.pkg) {
    if (isFocused.value)
      list.push('ring-3 ring-yellow:25! text-orange-600 dark:text-orange-300 border-orange!')
    else
      list.push('ring-3 ring-primary:25! text-primary-600 dark:text-primary-300')
  }

  if (props.pkg?.private)
    list.push('border-dashed!')

  return list
})

const classesInner = computed(() => {
  const list: string[] = []

  if (isFocused.value)
    list.push('bg-orange:10!')
  else if (props.selectionMode === 'selected')
    list.push('bg-primary:10!')

  if (props.selectionMode === 'faded')
    list.push('op75')

  return list
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
      :class="classesInner"
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

<script setup lang="ts">
import type { GraphBaseOptions } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import type { ChartNode } from '../../types/chart'
import { computed } from 'vue'

const props = defineProps<{
  selected?: ChartNode
  options: GraphBaseOptions<PackageNode | undefined>
}>()

const emit = defineEmits<{
  (e: 'select', node: ChartNode | null): void
}>()

const parentStack = computed(() => {
  const stack: ChartNode[] = []
  let current = props.selected
  while (current) {
    stack.unshift(current)
    current = current.parent
  }
  return stack
})
</script>

<template>
  <div flex="~ gap-1 items-center wrap">
    <template v-for="node, idx of parentStack" :key="node.id">
      <div v-if="idx > 0" i-ph-arrow-right-bold text-sm op-fade />
      <button
        hover="bg-active" rounded px1
        @click="emit('select', node)"
      >
        <DisplayPackageSpec v-if="node.meta" :pkg="node.meta" />
        <span v-else>{{ node.text || node.id }}</span>
      </button>
    </template>
  </div>
</template>

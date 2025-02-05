<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    nodes: { value: number, name: string, class?: string }[]
    rounded?: boolean
    percentage?: boolean
  }>(),
  {
    rounded: true,
    percentage: true,
  },
)

const total = computed(() => props.nodes.reduce((acc, { value }) => acc + value, 0))
</script>

<template>
  <div flex>
    <div
      v-for="(node, idx) of nodes"
      :key="node.name"
      :class="[
        node.class,
        props.rounded && idx === 0 ? 'rounded-l' : '',
        props.rounded && idx === nodes.length - 1 ? 'rounded-r' : '',
        idx !== 0 ? 'border-l' : '',
      ]"
      :style="{ flex: node.value }"
      text-center text-xs px1.5 py1 flex gap-x-0.5
    >
      <span>{{ node.name }}</span>
      <span v-if="percentage" op50>{{ `${+(node.value * 100 / total).toFixed(1)}%` }}</span>
    </div>
  </div>
</template>

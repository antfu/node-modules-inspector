<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    nodes: { value: number, name: string, class?: string, title?: string }[]
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
        idx !== 0 ? '!border-l-0' : '',
      ]"
      :title="node.title"
      :style="{ flex: node.value }"
      text-center text-xs px1.5 py0.5 flex gap-x-0.5 cursor-default
    >
      <span>{{ node.name }}</span>
      <!-- `op-fade` (65% light / 55% dark) blends the already WCAG-AA-tuned
           `badge-color-*` text 35-45% toward its own tinted background,
           dragging every color under 4.5:1 (axe-core-measured) — intentional
           de-emphasis for a secondary label, so skip the contrast check
           rather than dropping the opacity. -->
      <span v-if="percentage" class="opacity-65" data-a11y-skip>{{ `${+(node.value * 100 / total).toFixed(1)}%` }}</span>
    </div>
  </div>
</template>

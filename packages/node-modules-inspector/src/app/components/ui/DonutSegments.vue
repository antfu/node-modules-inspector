<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    nodes: { value: number, name: string, class?: string, title?: string }[]
    size?: number
    thickness?: number
  }>(),
  {
    size: 80,
    thickness: 10,
  },
)

const RADIUS = computed(() => (props.size - props.thickness) / 2)
const CENTER = computed(() => props.size / 2)
const TOTAL = computed(() => props.nodes.reduce((acc, n) => acc + n.value, 0))

const segments = computed(() => {
  if (TOTAL.value === 0)
    return []
  let cursor = 0
  return props.nodes
    .filter(n => n.value > 0)
    .map((node) => {
      const length = node.value / TOTAL.value * 100
      const offset = -cursor
      cursor += length
      return {
        ...node,
        length,
        offset,
      }
    })
})
</script>

<template>
  <div relative inline-flex :style="{ width: `${size}px`, height: `${size}px` }">
    <svg
      :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`"
      flex-none
    >
      <circle
        :cx="CENTER" :cy="CENTER" :r="RADIUS"
        fill="none"
        stroke="currentColor"
        class="op-10"
        :stroke-width="thickness"
      />
      <circle
        v-for="segment of segments"
        :key="segment.name"
        :cx="CENTER" :cy="CENTER" :r="RADIUS"
        fill="none"
        stroke="currentColor"
        :class="segment.class"
        :stroke-width="thickness"
        stroke-linecap="butt"
        path-length="100"
        :stroke-dasharray="`${segment.length} ${100 - segment.length}`"
        :stroke-dashoffset="segment.offset"
        :transform="`rotate(-90 ${CENTER} ${CENTER})`"
      >
        <title v-if="segment.title">{{ segment.title }}</title>
      </circle>
    </svg>
    <div absolute inset-0 flex="~ items-center justify-center">
      <slot />
    </div>
  </div>
</template>

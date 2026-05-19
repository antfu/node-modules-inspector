<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0..1 */
    value: number
    size?: number
    thickness?: number
  }>(),
  {
    size: 16,
    thickness: 3,
  },
)

const RADIUS = computed(() => (props.size - props.thickness) / 2)
const CIRCUMFERENCE = computed(() => 2 * Math.PI * RADIUS.value)
const filled = computed(() => Math.max(0, Math.min(1, props.value)) * CIRCUMFERENCE.value)
const empty = computed(() => CIRCUMFERENCE.value - filled.value)
const center = computed(() => props.size / 2)
</script>

<template>
  <svg
    :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`"
    flex-none
  >
    <circle
      :cx="center" :cy="center" :r="RADIUS"
      fill="none"
      stroke="currentColor"
      class="op-10"
      :stroke-width="thickness"
    />
    <circle
      :cx="center" :cy="center" :r="RADIUS"
      fill="none"
      stroke="currentColor"
      class="text-primary"
      :stroke-width="thickness"
      :stroke-dasharray="`${filled} ${empty}`"
      :transform="`rotate(-90 ${center} ${center})`"
      stroke-linecap="round"
    />
  </svg>
</template>

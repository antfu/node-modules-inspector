<script setup lang="ts">
import { getAgeColor } from '@antfu/design/utils/format'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** A duration (gap) in milliseconds, e.g. between two publish dates. */
    ms?: number
    colorize?: boolean
  }>(),
  {
    colorize: true,
  },
)

const MS_PER_DAY = 24 * 60 * 60 * 1000

const daysAgo = computed(() => Math.floor((props.ms ?? 0) / MS_PER_DAY))

const compact = computed(() => {
  if (!props.ms)
    return ['', '']
  if (daysAgo.value < 1)
    return [Math.floor(props.ms / (1000 * 60 * 60)), 'hr']
  if (daysAgo.value > 365)
    return [+(daysAgo.value / 365).toFixed(1), 'yr']
  if (daysAgo.value > 30)
    return [Math.round(daysAgo.value / 30), 'mo']
  return [daysAgo.value, 'd']
})

const color = computed(() => props.colorize ? getAgeColor(props.ms ?? 0) : 'color-scale-neutral')
</script>

<template>
  <div
    v-if="ms"
    :class="color"
    class="px-0.4em py-0.2em line-height-none bg-gray:5 text-sm"
  >
    <span font-mono>{{ compact[0] }}</span>
    <span text-xs ml0.5>{{ compact[1] }}</span>
  </div>
</template>

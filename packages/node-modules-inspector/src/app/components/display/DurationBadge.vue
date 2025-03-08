<script setup lang="ts">
import { computed } from 'vue'
import { settings } from '../../state/settings'

const props = withDefaults(
  defineProps<{
    ms?: number
    colorize?: boolean
    mode?: 'day' | 'hour'
  }>(),
  {
    colorize: true,
    mode: 'hour',
  },
)

const colorScale = [
  [180, 'color-scale-neutral'],
  [365, 'color-scale-low'],
  [365 * 3, 'color-scale-medium'],
  [365 * 5, 'color-scale-high'],
  [730 * 5, 'color-scale-critical'],
] as const

const MS_PER_DAY = 24 * 60 * 60 * 1000

const daysAgo = computed(() => {
  if (props.ms == null)
    return 0
  return Math.floor(props.ms / MS_PER_DAY)
})

const timeAgo = computed(() => {
  if (!props.ms)
    return ['', '']
  if (daysAgo.value < 1) {
    if (props.mode === 'day') {
      return ['today', '']
    }
    else {
      const hoursAgo = Math.floor(props.ms / (1000 * 60 * 60))
      return [hoursAgo, 'hr']
    }
  }
  if (daysAgo.value > 365)
    return [+(daysAgo.value / 365).toFixed(1), 'yr']
  if (daysAgo.value > 30)
    return [Math.round(daysAgo.value / 30), 'mo']
  return [daysAgo.value, 'd']
})

const color = computed(() => {
  if (!settings.value.colorizePackageSize && !props.colorize)
    return colorScale[0][1]

  for (const [limit, color] of colorScale) {
    if (daysAgo.value < limit)
      return color
  }

  return colorScale[colorScale.length - 1][1]
})
</script>

<template>
  <div
    v-if="ms"
    :class="color"
    class="px-0.4em py-0.2em line-height-none bg-gray:5 text-sm"
  >
    <span font-mono>{{ timeAgo[0] }}</span>
    <span op50 text-xs ml0.5>{{ timeAgo[1] }}</span>
  </div>
</template>

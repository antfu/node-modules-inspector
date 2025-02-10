<script setup lang="ts">
import { computed } from 'vue'
import { settings } from '~/state/settings'

const props = withDefaults(
  defineProps<{
    date: string | Date
    colorize?: boolean
  }>(),
  {
    colorize: true,
  },
)

const colorScale = [
  [180, 'color-scale-neutral'],
  [365, 'color-scale-low'],
  [365 * 3, 'color-scale-medium'],
  [365 * 5, 'color-scale-high'],
  [730 * 5, 'color-scale-critical'],
] as const

const daysAgo = computed(() => {
  const date = +new Date(props.date)
  const now = +new Date()

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((now - date) / msPerDay)
})

const timeAgo = computed(() => {
  if (daysAgo.value < 1)
    return [0, 'today']
  if (daysAgo.value > 365)
    return [+(daysAgo.value / 365).toFixed(1), 'years']
  if (daysAgo.value > 30)
    return [Math.floor(daysAgo.value / 30), 'months']
  return [daysAgo.value, 'days']
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
    :class="color"
    class="px-0.4em py-0.2em line-height-none bg-gray:5"
    :title="`Published at ${String(props.date)}`"
  >
    <span font-mono>{{ timeAgo[0] }}</span>
    <span op50 text-sm ml0.5>{{ timeAgo[1] }}</span>
  </div>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getPublishTime } from '~/state/payload'
import { settings } from '~/state/settings'

const props = withDefaults(
  defineProps<{
    pkg: PackageNode
    colorize?: boolean
  }>(),
  {
    colorize: true,
  },
)

const date = computed(() => getPublishTime(props.pkg))

const colorScale = [
  [180, 'color-scale-neutral'],
  [365, 'color-scale-low'],
  [365 * 3, 'color-scale-medium'],
  [365 * 5, 'color-scale-high'],
  [730 * 5, 'color-scale-critical'],
] as const

const daysAgo = computed(() => {
  if (!date.value)
    return 0
  const now = +new Date()

  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((now - +date.value) / msPerDay)
})

const timeAgo = computed(() => {
  if (daysAgo.value < 1)
    return ['', 'today']
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
    v-if="date"
    :class="color"
    class="px-0.4em py-0.2em line-height-none bg-gray:5 text-sm"
    :title="`Published at ${String(date)}`"
  >
    <span font-mono>{{ timeAgo[0] }}</span>
    <span op50 text-xs ml0.5>{{ timeAgo[1] }}</span>
  </div>
</template>

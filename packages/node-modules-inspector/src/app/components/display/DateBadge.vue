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
  [30, 'color-scale-neutral'],
  [180, 'color-scale-low'],
  [365, 'color-scale-medium'],
  [365 * 2, 'color-scale-high'],
  [730 * 5, 'color-scale-critical'],
] as const

const color = computed(() => {
  if (!settings.value.colorizePackageSize && !props.colorize)
    return colorScale[0][1]

  const date = new Date(props.date)
  const now = new Date()

  const msPerDay = 24 * 60 * 60 * 1000
  const daysAgo = Math.floor((now - date) / msPerDay)

  for (const [limit, color] of colorScale) {
    if (daysAgo < limit)
      return color
  }

  return colorScale[colorScale.length - 1][1]
})

const formatted = computed(() => {
  return new Date(props.date).toLocaleDateString()
})
</script>

<template>
  <div :class="color" class="px-0.4em py-0.2em font-mono line-height-none bg-gray:5">
    {{ formatted }}
  </div>
</template>

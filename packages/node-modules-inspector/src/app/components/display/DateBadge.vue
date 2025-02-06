<script setup lang="ts">
import { computed } from 'vue'
import { colorScale as cS } from '~/components/display/colorScale'
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
  [30, cS.neutral],
  [180, cS.low],
  [365, cS.medium],
  [365 * 2, cS.high],
  [730 * 5, cS.critical],
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

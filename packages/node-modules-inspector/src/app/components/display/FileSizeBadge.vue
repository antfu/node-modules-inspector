<script setup lang="ts">
import { computed } from 'vue'
import { settings } from '~/state/settings'
import { bytesToHumanSize } from '../../utils/format'
import { colorScale as cS } from './colorScale'

const props = withDefaults(
  defineProps<{
    bytes?: number
    colorize?: boolean
    digits?: number
  }>(),
  {
    colorize: true,
    digits: 2,
  },
)

const KB = 1024
const MB = KB ** 2

const colorScale = [
  [80 * KB, cS.neutral],
  [500 * KB, cS.low],
  [1 * MB, cS.medium],
  [10 * MB, cS.high],
  [20 * MB, cS.critical],
] as const

const color = computed(() => {
  if (!settings.value.colorizePackageSize && !props.colorize)
    return colorScale[0]
  const bytes = props.bytes || 0
  for (const [limit, color] of colorScale) {
    if (bytes < limit)
      return color
  }
  return colorScale[colorScale.length - 1][1]
})

const formatted = computed(() => bytesToHumanSize(props.bytes || 0, props.digits))
</script>

<template>
  <div v-if="bytes" :class="color" class="px-0.4em py-0.2em font-mono line-height-none bg-gray:5">
    {{ formatted[0] }}<span text-xs op75 ml-0.4>{{ formatted[1] }}</span>
  </div>
</template>

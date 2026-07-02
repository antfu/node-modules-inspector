<script setup lang="ts">
import { formatBytes, getBytesColor } from '@antfu/design/utils/format'
import { computed } from 'vue'
import { totalWorkspaceSize } from '../../state/payload'
import { settings } from '../../state/settings'

const props = withDefaults(
  defineProps<{
    bytes?: number
    colorize?: boolean
    digits?: number
    percent?: boolean
    total?: number
    icon?: string
    percentRatio?: number
  }>(),
  {
    percent: true,
    colorize: true,
    digits: 2,
    percentRatio: 0.5,
  },
)

const color = computed(() =>
  (settings.value.colorizePackageSize || props.colorize)
    ? getBytesColor(props.bytes || 0)
    : 'color-scale-neutral',
)

const ratio = computed(() => (props.bytes || 0) * 100 / (props.total ?? totalWorkspaceSize.value))

const formatted = computed(() => formatBytes(props.bytes || 0, { digits: props.digits }))
</script>

<template>
  <div v-if="bytes" :class="color" class="px-0.4em py-0.2em font-mono line-height-none bg-gray:5 dark:bg-gray:4 flex items-center">
    <div v-if="icon" :class="icon" class="mr-1" />
    {{ formatted[0] }}<span text-xs ml-0.4>{{ formatted[1] }}</span>
    <slot name="after">
      <span v-if="percent && ratio > percentRatio" text-xs ml1 border="l base" pl1>{{ +(ratio.toFixed(1)) }}%</span>
    </slot>
  </div>
</template>

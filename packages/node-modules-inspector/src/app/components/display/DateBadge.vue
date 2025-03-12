<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getPublishTime } from '../../state/payload'

const props = withDefaults(
  defineProps<{
    pkg?: PackageNode
    time?: number | Date
    colorize?: boolean
  }>(),
  {
    colorize: true,
  },
)

const date = computed(() => props.time
  ? new Date(props.time)
  : props.pkg
    ? getPublishTime(props.pkg)
    : undefined,
)

const formatter = Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const dateTitle = computed(() => date.value ? formatter.format(date.value) : null)
</script>

<template>
  <DisplayDurationBadge
    v-if="date"
    v-tooltip="dateTitle"
    :title="dateTitle"
    :ms="Date.now() - +date"
    :colorize="props.colorize"
    mode="day"
  />
</template>

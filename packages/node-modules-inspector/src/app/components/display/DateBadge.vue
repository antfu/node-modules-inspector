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
</script>

<template>
  <DisplayDurationBadge
    v-if="date"
    :ms="Date.now() - +date"
    :colorize="props.colorize"
    mode="day"
  />
</template>

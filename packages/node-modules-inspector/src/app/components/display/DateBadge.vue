<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import DisplayDate from '@antfu/design/components/Display/DisplayDate.vue'
import { computed } from 'vue'
import { getPublishTime } from '../../state/payload'
import { settings } from '../../state/settings'

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
  <div v-if="date" class="px-0.4em py-0.2em line-height-none bg-gray:5 text-sm w-max">
    <DisplayDate :date="date" :colorize="settings.colorizePackageSize || props.colorize" />
  </div>
</template>

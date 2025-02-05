<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { objectEntries } from '@antfu/utils'
import { computed } from 'vue'
import { FILE_CATEGORIES_COLOR_BADGE } from '../../utils/file-category'
import { bytesToHumanSize } from '../../utils/format'

const props = withDefaults(
  defineProps<{
    pkg: PackageNode
    rounded?: boolean
  }>(),
  {
    rounded: true,
  },
)

const nodes = computed(() => {
  const threshold = (props.pkg.resolved.installSize?.bytes ?? 0) * 0.01
  return objectEntries(props.pkg.resolved.installSize?.categories ?? {})
    .sort((a, b) => b[1]!.bytes - a[1]!.bytes)
    .filter(([_, c]) => c!.bytes > threshold)
    .map(([type, c]) => {
      const readable = bytesToHumanSize(c?.bytes || 0)
      return {
        value: c!.bytes,
        name: type.toUpperCase(),
        class: FILE_CATEGORIES_COLOR_BADGE[type],
        title: `${c?.count} ${type} files, in total ${readable[0]} ${readable[1]}`,
      }
    })
})
</script>

<template>
  <UiPercentage :nodes :rounded />
</template>

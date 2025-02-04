<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { payloads } from '~/state/payload'
import { getModuleTypeCounts } from '~/utils/module-type'

const props = withDefaults(
  defineProps<{
    pkg?: PackageNode
    packages?: PackageNode[]
    flat?: boolean
    rounded?: boolean
  }>(),
  {
    flat: false,
    rounded: true,
  },
)

const nodes = computed(() =>
  props.pkg
    ? [
        props.pkg,
        ...props.flat
          ? payloads.avaliable.flatDependencies(props.pkg)
          : payloads.avaliable.dependencies(props.pkg),
      ]
    : props.packages ?? [],
)

const counts = computed(() =>
  (Object.entries(getModuleTypeCounts(nodes.value)) as [PackageModuleType, number][])
    .filter(([_, c]) => c > 0),
)
</script>

<template>
  <div flex>
    <div
      v-for="([type, c], idx) of counts"
      :key="type"
      :class="[
        MODULE_TYPES_COLOR_BADGE[type],
        props.rounded && idx === 0 ? 'rounded-l' : '',
        props.rounded && idx === counts.length - 1 ? 'rounded-r' : '',
        idx !== 0 ? 'border-l' : '',
      ]"
      :style="{ flex: c }"
      text-center text-xs px1.5 py1 flex gap-x-0.5
    >
      <span>{{ type.toUpperCase() }}</span>
      <span op50>{{ `${+(c * 100 / nodes.length).toFixed(1)}%` }}</span>
    </div>
  </div>
</template>

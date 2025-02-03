<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getPackageFromSpec } from '~/state/data'
import { getModuleTypeCounts } from '../utils/module-type'

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
        ...Array.from(props.flat ? props.pkg.flatDependencies : props.pkg.dependencies)
          .map(getPackageFromSpec)
          .filter(x => !!x),
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
        counts.length === 1 ? 'justify-center' : '',
      ]"
      :style="{ flex: c }"
      text-center text-xs px1.5 py1 flex gap-x-0.5
    >
      <span>{{ type.toUpperCase() }}</span>
      <span op50>{{ `${+(c * 100 / nodes.length).toFixed(1)}%` }}</span>
    </div>
  </div>
</template>

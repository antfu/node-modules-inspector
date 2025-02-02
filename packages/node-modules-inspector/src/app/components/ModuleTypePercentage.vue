<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { packageData } from '~/state/data'
import { getModuleTypeCounts } from '../utils/module-type'

const props = defineProps<{
  pkg: PackageNode
  label?: boolean
  inline?: boolean
}>()

const nodes = computed(() => [
  props.pkg,
  ...Array.from(props.pkg.dependencies)
    .map(i => packageData.value?.packages.get(i))
    .filter(x => !!x),
])

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
        idx === 0 ? 'rounded-l' : '',
        idx === counts.length - 1 ? 'rounded-r' : '',
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

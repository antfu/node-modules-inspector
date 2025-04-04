<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'

defineProps<{
  packages: PackageNode[]
}>()

const value = defineModel('moduleValue', {
  type: Boolean,
  default: true,
})
</script>

<template>
  <details
    flex="~ col gap-2"
    :open="value"
    @toggle="value = ($event as any).target.open"
  >
    <summary text-xl flex="~ wrap items-center gap-2" cursor-pointer select-none hover:bg-active rounded p1>
      <div i-ph-caret-down transition duration-300 op-fade ml--5 text-base :class="value ? '' : 'rotate--90'" />
      <slot name="title" />
    </summary>
    <GridContainer v-if="value" :packages="packages" mb4 />
  </details>
</template>

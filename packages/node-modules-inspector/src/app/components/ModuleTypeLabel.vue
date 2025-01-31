<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'

defineProps<{
  type: PackageModuleType
}>()

const colors = {
  esm: 'bg-green:10 text-green',
  dual: 'bg-teal:10 text-teal',
  cjs: 'bg-yellow:10 text-yellow',
  faux: 'bg-orange:10 text-orange',
  types: 'bg-blue:10 text-blue',
}
</script>

<template>
  <div :class="colors[type]" px1 rounded w-12 text-sm flex-none text-center>
    {{ type.toUpperCase() }}
  </div>
</template>

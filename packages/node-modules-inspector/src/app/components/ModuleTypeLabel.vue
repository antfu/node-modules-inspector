<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'

withDefaults(defineProps<{
  type: PackageModuleType
  badge?: boolean
}>(), {
  badge: true,
})

const colors = {
  esm: 'bg-green:10 text-green',
  dual: 'bg-teal:10 text-teal',
  cjs: 'bg-yellow:10 text-yellow',
  faux: 'bg-lime:10 text-lime',
  dts: 'bg-blue:10 text-blue',
}
</script>

<template>
  <div :class="[colors[type], badge ? 'w-11 flex-none text-center px1 rounded text-sm' : 'bg-transparent! w-auto!']">
    {{ type.toUpperCase() }}
  </div>
</template>

<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getModuleType } from '~/utils/module-type'

const props = withDefaults(defineProps<{
  pkg: PackageNode | PackageModuleType
  badge?: boolean
}>(), {
  badge: true,
})

const type = computed(() => getModuleType(props.pkg))
</script>

<template>
  <div
    select-none
    :class="[MODULE_TYPES_COLOR_BADGE[type], badge ? 'w-11 flex-none text-center px1 rounded text-sm' : 'bg-transparent! w-auto!']"
  >
    {{ type.toUpperCase() }}
  </div>
</template>

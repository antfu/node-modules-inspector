<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { settings } from '~/state/settings'
import { getModuleType } from '~/utils/module-type'

const props = withDefaults(defineProps<{
  pkg: PackageNode | PackageModuleType
  badge?: boolean
  force?: boolean
}>(), {
  badge: true,
})

const show = computed(() => props.force || !settings.value.moduleTypeHide)
const type = computed(() => getModuleType(props.pkg))
</script>

<template>
  <div
    v-if="show"
    select-none
    :class="[MODULE_TYPES_COLOR_BADGE[type], badge ? 'w-11 flex-none text-center px1 rounded text-sm' : 'bg-transparent! w-auto!']"
  >
    {{ type.toUpperCase() }}
  </div>
</template>

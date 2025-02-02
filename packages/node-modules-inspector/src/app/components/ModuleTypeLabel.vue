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

const colors = {
  esm: 'bg-primary:10 text-primary-400 dark:text-primary-300',
  dual: 'bg-teal:10 text-teal-600 dark:text-teal-300',
  cjs: 'bg-yellow:10 text-yellow-600 dark:text-yellow-300',
  faux: 'bg-lime:10 text-lime-600 dark:text-lime-300',
  dts: 'bg-blue:10 text-blue-600 dark:text-blue-300',
}
</script>

<template>
  <div select-none :class="[colors[type], badge ? 'w-11 flex-none text-center px1 rounded text-sm' : 'bg-transparent! w-auto!']">
    {{ type.toUpperCase() }}
  </div>
</template>

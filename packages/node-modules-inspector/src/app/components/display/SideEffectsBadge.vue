<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { settings } from '../../state/settings'

const props = defineProps<{
  pkg: PackageNode
  class?: string
}>()

const sideEffects = computed(() => props.pkg.resolved?.sideEffects)

const isShown = computed(() => {
  if (!settings.value.showSideEffectsBadge)
    return false
  return sideEffects.value !== undefined
})

const icon = computed(() => {
  if (sideEffects.value === false)
    return 'i-ph:tree-structure-duotone text-green-400'
  if (sideEffects.value === true)
    return 'i-ph:warning-circle-duotone text-amber-400'
  // array of file paths
  return 'i-ph:warning-circle-duotone text-yellow-400'
})

const description = computed(() => {
  if (sideEffects.value === false)
    return 'This package has no side effects (safe to tree-shake)'
  if (sideEffects.value === true)
    return 'This package has side effects (may not be fully tree-shakeable)'
  if (Array.isArray(sideEffects.value))
    return `This package has side effects in ${sideEffects.value.length} file pattern(s) (partially tree-shakeable)`
  return undefined
})
</script>

<template>
  <span
    v-if="isShown" v-tooltip="description"
    :class="[props.class, icon]"
    h-1.1em inline-flex align-middle
  />
</template>

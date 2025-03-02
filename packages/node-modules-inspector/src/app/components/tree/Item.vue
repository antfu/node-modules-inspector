<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { selectedNode } from '~/state/current'

withDefaults(
  defineProps<{
    pkg?: PackageNode
    showModuleType?: boolean
    showSourceType?: boolean
  }>(),
  {
    showModuleType: true,
    showSourceType: false,
  },
)
</script>

<template>
  <button
    v-if="pkg"
    flex="~ gap-2 items-center"
    ws-nowrap rounded
    hover="bg-active"
    @click="selectedNode = pkg"
  >
    <DisplayModuleType v-if="showModuleType" :pkg />
    <DisplaySourceTypeBadge v-if="showSourceType" :pkg />
    <DisplayPackageSpec :pkg />
  </button>
</template>

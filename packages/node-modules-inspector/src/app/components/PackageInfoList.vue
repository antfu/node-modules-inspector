<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { selectedNode } from '../state/current'
import { settings } from '../state/settings'

defineProps<{
  pkg?: PackageNode
}>()
</script>

<template>
  <button
    v-if="pkg"
    flex="~ gap-2 items-center"
    ws-nowrap rounded
    hover="bg-active"
    @click="selectedNode = pkg"
  >
    <ModuleTypeLabel v-if="!settings.moduleTypeHide" :pkg />
    <div font-mono>
      {{ pkg.name }}<span op50>@{{ pkg.version }}</span>
    </div>
  </button>
</template>

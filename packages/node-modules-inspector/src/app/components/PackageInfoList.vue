<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { selectedNode } from '../state/current'

defineProps<{
  pkg?: ResolvedPackageNode
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
    <ModuleTypeLabel :type="pkg.resolved.module" />
    <div font-mono>
      {{ pkg.name }}<span op50>@{{ pkg.version }}</span>
    </div>
  </button>
</template>

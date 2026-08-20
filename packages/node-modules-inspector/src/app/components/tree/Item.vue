<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { selectedNode } from '../../state/current'
import DisplayModuleType from '../display/ModuleType'
import DisplayPackageSpec from '../display/PackageSpec.vue'
import DisplayProvenanceBadge from '../display/ProvenanceBadge.vue'
import DisplaySourceTypeBadge from '../display/SourceTypeBadge.vue'

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
    hover="bg-hover"
    @click="selectedNode = pkg"
  >
    <slot name="before" />
    <DisplayModuleType v-if="showModuleType" :pkg />
    <DisplaySourceTypeBadge v-if="showSourceType" :pkg />
    <DisplayPackageSpec :pkg>
      <DisplayProvenanceBadge :pkg class="translate-x-1 translate-y-0.55" />
    </DisplayPackageSpec>
    <slot name="after" />
  </button>
</template>

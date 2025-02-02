<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { selectedNode } from '../state/current'

defineProps<{
  pkg: PackageNode
}>()
</script>

<template>
  <button
    border="~ base rounded-lg" px3 py2 flex="~ col gap-2"
    bg-glass
    hover="bg-active"
    @click="selectedNode = pkg"
  >
    <div font-mono text-left>
      {{ pkg.name }}<span op50>@{{ pkg.version }}</span>
    </div>
    <div flex="~ wrap gap-2 items-center" text-sm>
      <ModuleTypeLabel :pkg />
      <template v-if="pkg.flatDependents.size">
        <div flex="~ items-center gap-1">
          <div i-ph-arrow-elbow-down-right-duotone />
          <div op75>
            {{ pkg.flatDependents.size }}
          </div>
        </div>
        <span op25>·</span>
      </template>

      <template v-if="pkg.flatDependencies.size">
        <div flex="~ items-center gap-1">
          <div i-ph-lego-duotone />
          <div op75>
            {{ pkg.flatDependencies.size }}
          </div>
        </div>
        <span op25>·</span>
      </template>

      <div op75>
        {{ pkg.resolved.license }}
      </div>
      <template v-if="pkg.resolved.author">
        <span op25>·</span>
        <div op75>
          {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
        </div>
      </template>
    </div>
  </button>
</template>

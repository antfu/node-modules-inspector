<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { selectedNode } from '../../state/current'

defineProps<{
  pkg: PackageNode
}>()
</script>

<template>
  <button
    border="~ rounded-lg" px3 py2 flex="~ col gap-2"
    bg-glass
    hover="bg-active"
    :class="selectedNode === pkg ? 'border-primary ring-3 ring-primary:15' : 'border-base'"
    @click="selectedNode = pkg"
  >
    <DisplayPackageSpec :pkg text-left />
    <div flex="~ wrap gap-2 items-center" text-sm>
      <DisplayModuleType :pkg />
      <template v-if="pkg.flatDependents.size">
        <div flex="~ items-center gap-1">
          <div i-ph-arrow-elbow-down-right-duotone />
          <DisplayNumberBadge :number="pkg.flatDependents.size" rounded-full text-sm />
        </div>
      </template>

      <template v-if="pkg.flatDependencies.size">
        <div flex="~ items-center gap-1">
          <div i-ph-lego-duotone />
          <DisplayNumberBadge :number="pkg.flatDependencies.size" rounded-full text-sm />
        </div>
      </template>

      <span op25>·</span>
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

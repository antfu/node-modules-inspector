<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { selectedNode } from '../state/current'

defineProps<{
  pkg: ResolvedPackageNode
}>()

const colors = {
  esm: 'bg-green:10 text-green',
  dual: 'bg-teal:10 text-teal',
  cjs: 'bg-yellow:10 text-yellow',
  faux: 'bg-orange:10 text-orange',
  types: 'bg-blue:10 text-blue',
}
</script>

<template>
  <button
    border="~ base rounded" p2 flex="~ col gap-2"
    hover="bg-active"
    @click="selectedNode = pkg"
  >
    <div font-mono>
      {{ pkg.name }}<span op50>@{{ pkg.version }}</span>
    </div>
    <div flex="~ gap-2" text-sm>
      <div :class="colors[pkg.resolved.module]" px1 rounded>
        {{ pkg.resolved.module.toUpperCase() }}
      </div>
      <div op75>
        {{ pkg.resolved.license }}
      </div>
      <div op75>
        {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
      </div>
    </div>
  </button>
</template>

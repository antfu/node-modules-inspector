<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { payloads } from '~/state/payload'

const MAX_DEPTH = 5

const depthMap = computed(() => {
  const map = new Map<number, PackageNode[]>()

  for (const pkg of payloads.filtered.packages) {
    let depth = pkg.depth
    if (depth >= MAX_DEPTH)
      depth = MAX_DEPTH
    if (!map.has(depth))
      map.set(depth, [])
    map.get(depth)?.push(pkg)
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
})
</script>

<template>
  <CanvasContainer>
    <div flex="~ col gap-2">
      <GridExpand
        v-for="([depth, packages]) of depthMap" :key="depth"
        :packages="packages"
        :module-value="depth >= 4 ? false : true"
      >
        <template #title>
          <span v-if="depth" op75>Depth {{ depth }}{{ depth === MAX_DEPTH ? '+' : '' }}</span>
          <span v-else op75>Workspace Packages</span>
          <DisplayNumberBadge :number="packages.length" rounded-full ml2 text-base />
        </template>
      </GridExpand>
    </div>
  </CanvasContainer>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { filteredPackages } from '~/state/filters'

const depthMap = computed(() => {
  const map = new Map<number, PackageNode[]>()

  for (const pkg of filteredPackages.value) {
    const depth = pkg.depth
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
      >
        <template #title>
          <span v-if="depth">Depth {{ depth }}</span>
          <span v-else>Workspace Packages</span>
          <div font-mono bg-active px1 ml2 rounded text-base op50>
            {{ packages.length }}
          </div>
        </template>
      </GridExpand>
    </div>
  </CanvasContainer>
</template>

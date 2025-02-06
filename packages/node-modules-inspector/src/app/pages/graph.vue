<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { filters } from '~/state/filters'
import { payloads } from '~/state/payload'

const payload = payloads.filtered

const rootPackages = computed(() => {
  if (filters.state.focus?.length)
    return filters.state.focus.map(payload.get).filter(x => !!x)

  const sortedByDepth = [...payload.packages].sort((a, b) => b.depth - a.depth)
  const rootMap = new Map<string, PackageNode>(payload.packages.map(x => [x.spec, x]))
  let changed = true
  while (changed) {
    changed = false
    for (const pkg of sortedByDepth) {
      if (pkg.workspace)
        continue
      if (!rootMap.has(pkg.spec))
        continue
      for (const parent of pkg.dependents) {
        if (rootMap.has(parent)) {
          rootMap.delete(pkg.spec)
          changed = true
        }
      }
    }
  }

  const rootPackages = Array.from(rootMap.values())
    .sort((a, b) => a.depth - b.depth || b.flatDependencies.size - a.flatDependencies.size)

  return rootPackages
})
</script>

<template>
  <GraphCanvas :payload="payloads.filtered" :root-packages="rootPackages" />
</template>

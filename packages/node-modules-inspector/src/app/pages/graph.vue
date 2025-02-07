<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { filters } from '~/state/filters'
import { payloads } from '~/state/payload'

const payload = payloads.filtered

const rootPackages = computed(() => {
  const root = filters.state.focus?.length
    ? filters.state.focus.map(payload.get).filter(x => !!x)
    : payload.packages.filter(x => x.workspace)

  // We traverse the dependency graph starting from the root packages
  // If see if all packages are reachable
  const seen = new Set<PackageNode>()
  function traverse(pkg?: PackageNode) {
    if (!pkg)
      return
    if (seen.has(pkg))
      return
    seen.add(pkg)
    for (const dep of pkg.dependencies) {
      traverse(payload.get(dep))
    }
  }
  for (const pkg of root) {
    traverse(pkg)
  }

  // If not, we add those orphan packages to the root packages
  const orphan = new Set(payload.packages.filter(x => !seen.has(x)).sort((a, b) => a.depth - b.depth))
  let changed = true
  while (changed) {
    changed = false
    for (const pkg of orphan) {
      // Remove from roots if they are a dependency of another orphan package
      if (payload.dependents(pkg).some(x => orphan.has(x))) {
        orphan.delete(pkg)
        changed = true
      }
    }
  }
  // Add the orphan packages to the root packages
  for (const pkg of orphan) {
    root.push(pkg)
  }

  return Array.from(root)
    .sort((a, b) => a.depth - b.depth || b.flatDependencies.size - a.flatDependencies.size)
})
</script>

<template>
  <GraphCanvas :payload="payloads.filtered" :root-packages="rootPackages" />
</template>

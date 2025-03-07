<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { useRoute } from '#app/composables/router'
import { CLUSTER_DEP_DEV, CLUSTER_DEP_PROD } from 'node-modules-tools/constants'
import { computed } from 'vue'
import { payloads } from '~/state/payload'

const params = useRoute().params as Record<string, string>
const tab = computed<'depth' | 'clusters' | 'module-type'>(() => params.slug[0] as any || 'depth')

const MAX_DEPTH = 5

interface Group {
  name: string
  catalog?: string
  module?: PackageModuleType
  packages: PackageNode[]
  expanded?: boolean
}

const groups = computed<Group[]>(() => {
  if (tab.value === 'module-type') {
    const map = new Map<string, PackageNode[]>()
    for (const pkg of payloads.filtered.packages) {
      const type = pkg.resolved.module
      if (!map.has(type))
        map.set(type, [])
      map.get(type)?.push(pkg)
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, packages]) => ({
        name: '',
        module: type,
        packages,
        expanded: false,
      }))
  }
  if (tab.value === 'clusters') {
    const map = new Map<string, PackageNode[]>()
    for (const pkg of payloads.filtered.packages) {
      const clusters = payloads.filtered.flatClusters(pkg)
      for (const cluster of clusters) {
        if (!map.has(cluster))
          map.set(cluster, [])
        map.get(cluster)?.push(pkg)
      }
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cluster, packages]) => {
        let name = cluster
        let catalog
        if (name === CLUSTER_DEP_DEV) {
          name = 'Dev Dependencies'
        }
        else if (name === CLUSTER_DEP_PROD) {
          name = 'Prod Dependencies'
        }
        else if (name.startsWith('catalog:')) {
          catalog = name.slice(8)
          name = `Catalog: `
        }

        return {
          name,
          catalog,
          packages,
          expanded: false,
        }
      })
  }
  else {
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
      .map(([depth, packages]) => ({
        name: depth === 0 ? 'Workspace Packages' : `Depth ${depth}`,
        packages,
        expanded: depth < 4,
      }))
  }
})
</script>

<template>
  <div flex="~ col gap-2">
    <div flex="~ gap-2 items-center wrap" mb4>
      <NuxtLink btn-action as="button" to="/grid/depth" active-class="text-primary bg-primary:5">
        <div i-ph-stack-simple-duotone />
        Group by Depth
      </NuxtLink>
      <NuxtLink btn-action as="button" to="/grid/module-type" active-class="text-primary bg-primary:5">
        <div i-ph-files-duotone />
        Group by Module Type
      </NuxtLink>
      <NuxtLink btn-action as="button" to="/grid/clusters" active-class="text-primary bg-primary:5">
        <div i-ph-exclude-duotone />
        Group by Clusters
      </NuxtLink>
    </div>

    <GridExpand
      v-for="(group, index) of groups"
      :key="index"
      :packages="group.packages"
      :module-value="group.expanded"
    >
      <template #title>
        <div flex="~ items-center gap-1">
          <span op75>{{ group.name }}</span>
          <div v-if="group.catalog" rounded-full text-base badge-color-primary px2>
            {{ group.catalog }}
          </div>
          <DisplayModuleType v-if="group.module" :pkg="group.module" />
        </div>
        <DisplayNumberBadge :number="group.packages.length" rounded-full ml2 text-base />
      </template>
    </GridExpand>
  </div>
</template>

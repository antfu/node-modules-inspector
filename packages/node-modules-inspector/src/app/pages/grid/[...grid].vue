<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import type { ParsedAuthor } from 'node-modules-tools/utils'
import DisplayNumberBadge from '@antfu/design/components/Display/DisplayNumberBadge.vue'
import { computed } from 'vue'
import { useRoute } from '#app/composables/router'
import { NuxtLink } from '#components'
import DisplayAuthors from '../../components/display/Authors.vue'
import DisplayClusterBadge from '../../components/display/ClusterBadge.vue'
import DisplayModuleType from '../../components/display/ModuleType'
import GridExpand from '../../components/grid/Expand.vue'
import { getNpmMeta, payloads } from '../../state/payload'
import { getModuleType } from '../../utils/module-type'
import { getSupplyChainScore, SUPPLY_CHAIN_SIGNALS } from '../../utils/supply-chain'

const params = useRoute().params as Record<string, string>
const tab = computed<'depth' | 'clusters' | 'module-type' | 'authors' | 'licenses' | 'supply-chain'>(() => params.grid?.[0] as any || 'depth')

const location = window.location

const MAX_DEPTH = 5

interface Group {
  name: string
  description?: string
  cluster?: string
  module?: PackageModuleType
  author?: ParsedAuthor
  packages: PackageNode[]
  expanded?: boolean
}

const groups = computed<Group[]>(() => {
  if (tab.value === 'module-type') {
    const map = new Map<string, PackageNode[]>()
    for (const pkg of payloads.filtered.packages) {
      const type = getModuleType(pkg)
      if (!map.has(type))
        map.set(type, [])
      map.get(type)?.push(pkg)
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, packages]) => ({
        name: type,
        module: type,
        packages,
        expanded: false,
      }))
  }
  else if (tab.value === 'clusters') {
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
      .map(([cluster, packages]) => ({
        name: cluster,
        cluster,
        packages,
        expanded: false,
      }))
  }
  else if (tab.value === 'authors') {
    const map = new Map<string, { author: ParsedAuthor, packages: PackageNode[] }>()
    const UNSPECIFIED: ParsedAuthor = { type: 'text', name: '<Unspecified>' }
    for (const pkg of payloads.filtered.packages) {
      const authors = pkg.resolved.authors?.length ? pkg.resolved.authors : [UNSPECIFIED]
      for (const author of authors) {
        const key = author.type === 'github' ? `@${author.github}` : author.name
        let entry = map.get(key)
        if (!entry) {
          entry = { author, packages: [] }
          map.set(key, entry)
        }
        entry.packages.push(pkg)
      }
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { author, packages }]) => ({
        name: key,
        author,
        packages,
        expanded: false,
      }))
  }
  else if (tab.value === 'licenses') {
    const map = new Map<string, PackageNode[]>()
    for (const pkg of payloads.filtered.packages) {
      const license = pkg.resolved.license || '<Unspecified>'
      if (!map.has(license))
        map.set(license, [])
      map.get(license)?.push(pkg)
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([license, packages]) => ({
        name: license,
        license,
        packages,
        expanded: false,
      }))
  }
  else if (tab.value === 'supply-chain') {
    // Grouped by how many of the three signals a package has, best first. Only
    // the top and bottom groups are a single combination, so the others are
    // named by count and spelled out in the tooltip.
    const map = new Map<number, PackageNode[]>([[3, []], [2, []], [1, []], [0, []]])
    for (const pkg of payloads.filtered.packages)
      map.get(getSupplyChainScore(getNpmMeta(pkg)))!.push(pkg)

    return [...map.entries()]
      .map(([score, packages]) => ({
        name: score === 3
          ? `All ${SUPPLY_CHAIN_SIGNALS.length} Signals`
          : score === 0 ? 'No Signals' : `${score} of ${SUPPLY_CHAIN_SIGNALS.length} Signals`,
        description: score === 3
          ? SUPPLY_CHAIN_SIGNALS.join(' + ')
          : `${score === 0 ? 'None' : `Any ${score}`} of: ${SUPPLY_CHAIN_SIGNALS.join(', ')}`,
        packages,
        expanded: score > 0,
      }))
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
        expanded: depth < 3,
      }))
  }
})
</script>

<template>
  <div flex="~ col gap-2">
    <div flex="~ gap-2 items-center wrap" mb4>
      <div op-fade>
        Group by
      </div>
      <!-- Two axe-core-measured contrast fixes on every active tab below:
           `btn-action` always applies `op75`, so `op100!` is needed to stop
           the active color being diluted toward its 5%-tint background; and
           the plain `text-primary` DEFAULT shade is tuned for its own solid
           swatch, not for sitting on that same near-white/near-black tint, so
           `-700`/`dark:-300` (matching `PackageBorder.vue`) replace it. -->
      <NuxtLink btn-action as="button" :to="{ path: '/grid/depth', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
        <div i-ph-stack-simple-duotone />
        Depth
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/module-type', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
        <div i-ph-file-code-duotone />
        Module Type
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/clusters', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
        <div i-ph-exclude-duotone />
        Clusters
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/authors', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
        <div i-ph-user-circle-duotone />
        Authors
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/licenses', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
        <div i-ph-file-text-duotone />
        License
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/supply-chain', hash: location.hash }" active-class="text-primary-700 dark:text-primary-300 bg-primary:5 op100!">
        <div i-ph:shield-check-duotone />
        Supply Chain
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
          <DisplayClusterBadge v-if="group.cluster" :cluster="group.cluster" />
          <DisplayModuleType v-else-if="group.module" :pkg="group.module" />
          <DisplayAuthors v-else-if="group.author" :authors="[group.author]" :link="false" />
          <span v-else v-tooltip="group.description" op75>{{ group.name }}</span>
        </div>
        <DisplayNumberBadge :value="group.packages.length" ml2 />
      </template>
    </GridExpand>
  </div>
</template>

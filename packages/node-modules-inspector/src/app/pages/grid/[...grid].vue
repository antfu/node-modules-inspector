<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { useRoute } from '#app/composables/router'
import { computed } from 'vue'
import SafeImage from '@/components/display/SafeImage.vue'
import { getNpmMeta, payloads } from '../../state/payload'
import { getModuleType } from '../../utils/module-type'
import { getAuthors, getPackageData, getRepository } from '../../utils/package-json'

const params = useRoute().params as Record<string, string>
const tab = computed<'depth' | 'clusters' | 'module-type' | 'authors' | 'licenses' | 'github' | 'provenance'>(() => params.grid?.[0] as any || 'depth')

const location = window.location

const MAX_DEPTH = 5

interface Group {
  name: string
  cluster?: string
  module?: PackageModuleType
  org?: string
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
    const map = new Map<string, PackageNode[]>()
    for (const pkg of payloads.filtered.packages) {
      const authors = getAuthors(pkg) || []
      if (!authors.length)
        authors.push({ name: '<Unspecified>', url: undefined })
      for (const author of authors) {
        if (!map.has(author.name))
          map.set(author.name, [])
        map.get(author.name)?.push(pkg)
      }
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([author, packages]) => ({
        name: author,
        author,
        packages,
        expanded: false,
      }))
  }
  else if (tab.value === 'licenses') {
    const map = new Map<string, PackageNode[]>()
    for (const pkg of payloads.filtered.packages) {
      const license = getPackageData(pkg).license || '<Unspecified>'
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
  else if (tab.value === 'github') {
    const map = new Map<string, PackageNode[]>()
    for (const pkg of payloads.filtered.packages) {
      const org = getRepository(pkg)?.org || '<Unspecified>'
      if (!map.has(org))
        map.set(org, [])
      map.get(org)?.push(pkg)
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([org, packages]) => ({
        name: org,
        org,
        packages,
        expanded: false,
      }))
  }
  else if (tab.value === 'provenance') {
    const map = new Map<'Trusted Publisher' | 'Provenance' | 'None', PackageNode[]>([
      ['Trusted Publisher', []],
      ['Provenance', []],
      ['None', []],
    ])
    for (const pkg of payloads.filtered.packages) {
      const meta = getNpmMeta(pkg)
      const provenance = meta?.provenance === 'trustedPublisher'
        ? 'Trusted Publisher'
        : meta?.provenance === true ? 'Provenance' : 'None'
      map.get(provenance)!.push(pkg)
    }

    return [...map.entries()]
      .map(([provenance, packages]) => ({
        name: provenance,
        provenance,
        packages,
        expanded: provenance !== 'None',
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
      <NuxtLink btn-action as="button" :to="{ path: '/grid/depth', hash: location.hash }" active-class="text-primary bg-primary:5">
        <div i-ph-stack-simple-duotone />
        Depth
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/module-type', hash: location.hash }" active-class="text-primary bg-primary:5">
        <div i-ph-file-code-duotone />
        Module Type
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/clusters', hash: location.hash }" active-class="text-primary bg-primary:5">
        <div i-ph-exclude-duotone />
        Clusters
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/authors', hash: location.hash }" active-class="text-primary bg-primary:5">
        <div i-ph-user-circle-duotone />
        Authors
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/licenses', hash: location.hash }" active-class="text-primary bg-primary:5">
        <div i-ph-file-text-duotone />
        License
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/github', hash: location.hash }" active-class="text-primary bg-primary:5">
        <div i-ph-users-duotone />
        GitHub Slug
      </NuxtLink>
      <NuxtLink btn-action as="button" :to="{ path: '/grid/provenance', hash: location.hash }" active-class="text-primary bg-primary:5">
        <div i-ph:circle-wavy-check-duotone />
        Provenance
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
          <SafeImage
            v-if="group.org" :src="`https://avatars.antfu.dev/gh/${group.org}`"
            bg-active border="~ base rounded-full"
            w6 h6 crossorigin="anonymous"
          />
          <DisplayClusterBadge v-if="group.cluster" :cluster="group.cluster" />
          <DisplayModuleType v-else-if="group.module" :pkg="group.module" />
          <span v-else op75>{{ group.name }}</span>
        </div>
        <DisplayNumberBadge :number="group.packages.length" rounded-full ml2 text-base />
      </template>
    </GridExpand>
  </div>
</template>

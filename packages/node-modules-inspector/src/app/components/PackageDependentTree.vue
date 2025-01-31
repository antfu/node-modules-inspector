<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  currents?: ResolvedPackageNode[]
  list?: ResolvedPackageNode[]
  type: 'dependencies' | 'dependents'
  known?: string[]
  depth?: number
  maxDepth?: number
}>(), {
  depth: 1,
  maxDepth: 6,
})

const known = computed(() => {
  return [...props.known || [], ...props.currents?.map(i => i.spec) || []]
})

const tree = computed(() => {
  return props.currents
    ?.map((pkg) => {
      return {
        pkg,
        children: props.list?.filter(i => !known.value.includes(i.spec) && i[props.type].has(pkg.spec)),
      }
    })
    .sort((a, b) => (b.children?.length || 0) - (a.children?.length || 0))
})
</script>

<template>
  <div flex="~ col gap-1">
    <template v-for="{ pkg, children } of tree" :key="pkg.spec">
      <PackageInfoList :pkg="pkg" />
      <PackageDependentTree
        v-if="children?.length && props.depth < props.maxDepth"
        ml3
        :currents="children"
        :list="props.list"
        :type="props.type"
        :known="known"
        :depth="props.depth + 1"
        :max-depth="props.maxDepth"
      />
    </template>
  </div>
</template>

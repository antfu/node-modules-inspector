<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  currents?: PackageNode[]
  list?: PackageNode[]
  type: 'dependencies' | 'dependents'
  seen?: string[]
  depth?: number
  maxDepth?: number
}>(), {
  depth: 1,
  maxDepth: 6,
})

const seen = computed(() => {
  return [...props.seen || [], ...props.currents?.map(i => i.spec) || []]
})

const tree = computed(() => {
  return props.currents
    ?.filter(x => !!x)
    .map((pkg) => {
      return {
        pkg,
        children: props.list?.filter((i) => {
          if (seen.value.includes(i.spec))
            return false
          if (props.type === 'dependents')
            return i.dependents.has(pkg.spec)
          else if (props.type === 'dependencies')
            return pkg.dependencies.has(i.spec)
          return false
        }),
      }
    })
    .sort((a, b) => (b.children?.length || 0) - (a.children?.length || 0))
})
</script>

<template>
  <div flex="~ col gap-1">
    <template v-for="{ pkg, children } of tree" :key="pkg.spec">
      <PackageInfoList :pkg="pkg" />
      <template v-if="children?.length">
        <RenderNextTick v-if="props.depth < props.maxDepth">
          <PackageDependentTree
            ml4
            :currents="children"
            :list="props.list"
            :type="props.type"
            :seen="seen"
            :depth="props.depth + 1"
            :max-depth="props.maxDepth"
          />
        </RenderNextTick>
        <div v-else-if="props.maxDepth > 2" ml6>
          <span op50 px2 bg-active rounded text-sm>
            {{ children?.length }} more ···
          </span>
        </div>
      </template>
    </template>
  </div>
</template>

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
  groupBy?: 'none' | 'catalog' | 'module'
}>(), {
  depth: 1,
  maxDepth: 6,
  groupBy: 'none',
})

const NO_CATALOG = '__no_catalog__'

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

function getGroupKey(pkg: PackageNode, mode: 'catalog' | 'module'): string {
  if (mode === 'catalog') {
    for (const c of pkg.clusters) {
      if (c.startsWith('catalog:'))
        return c
    }
    return NO_CATALOG
  }
  return pkg.resolved.module
}

const groups = computed(() => {
  if (props.groupBy === 'none' || props.depth !== 1)
    return null
  const mode = props.groupBy
  const map = new Map<string, PackageNode[]>()
  for (const pkg of props.currents || []) {
    if (!pkg)
      continue
    const key = getGroupKey(pkg, mode)
    let group = map.get(key)
    if (!group) {
      group = []
      map.set(key, group)
    }
    group.push(pkg)
  }
  const keys = Array.from(map.keys())
  keys.sort((a, b) => {
    if (mode === 'catalog') {
      const order = (k: string) => k === NO_CATALOG ? 2 : k === 'catalog:default' ? 1 : 0
      const oa = order(a)
      const ob = order(b)
      if (oa !== ob)
        return oa - ob
      return a.localeCompare(b)
    }
    if (a === 'unknown')
      return 1
    if (b === 'unknown')
      return -1
    return a.localeCompare(b)
  })
  return keys.map(key => ({
    key,
    pkgs: map.get(key)!,
  }))
})

function getGroupLabel(key: string): string {
  if (props.groupBy === 'catalog')
    return key === NO_CATALOG ? 'No catalog' : key
  return key.toUpperCase()
}
</script>

<template>
  <div flex="~ col gap-1">
    <template v-if="groups">
      <div v-for="group of groups" :key="group.key" flex="~ col gap-1">
        <div flex="~ items-center gap-1" mt2 mb1>
          <DisplayClusterBadge
            v-if="props.groupBy === 'catalog' && group.key !== NO_CATALOG"
            :cluster="group.key"
          />
          <div v-else op-fade text-sm>
            {{ getGroupLabel(group.key) }}
          </div>
        </div>
        <TreeDependencies
          :currents="group.pkgs"
          :list="props.list"
          :type="props.type"
          :seen="seen"
          :depth="props.depth"
          :max-depth="props.maxDepth"
          group-by="none"
        />
      </div>
    </template>
    <template v-else>
      <template v-for="{ pkg, children } of tree" :key="pkg.spec">
        <TreeItem :pkg="pkg" />
        <template v-if="children?.length">
          <RenderNextTick v-if="props.depth < props.maxDepth">
            <TreeDependencies
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
            <span op-fade px2 bg-active rounded text-sm>
              {{ children?.length }} more ···
            </span>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

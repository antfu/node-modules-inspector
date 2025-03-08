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
  sortBy?: 'depth' | 'name'
  groupByCatalog?: boolean
}>(), {
  depth: 1,
  maxDepth: 6,
  sortBy: 'depth',
  groupByCatalog: true,
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
    .sort((a, b) => {
      if (props.sortBy === 'depth')
        return (b.children?.length || 0) - (a.children?.length || 0)
      else
        return a.pkg.name.localeCompare(b.pkg.name)
    })
})

// Group packages by catalog
const groupedTree = computed(() => {
  if (!props.groupByCatalog || !props.currents?.length) {
    return { null: tree.value || [] }
  }

  const grouped: Record<string, { pkg: PackageNode, children: PackageNode[] | undefined }[]> = {}

  for (const item of tree.value || []) {
    const catalog = item.pkg.resolved?.catalog || 'null'
    if (!grouped[catalog]) {
      grouped[catalog] = []
    }
    grouped[catalog].push(item)
  }

  return grouped
})

// Sort the catalog keys to ensure consistent display order
const sortedCatalogKeys = computed(() => {
  if (!groupedTree.value)
    return []

  return Object.keys(groupedTree.value).sort((a, b) => {
    // Always put 'null' (no catalog) at the end
    if (a === 'null')
      return 1
    if (b === 'null')
      return -1
    // Put 'default' catalog after named catalogs
    if (a === 'default')
      return 1
    if (b === 'default')
      return -1
    // Otherwise sort alphabetically
    return a.localeCompare(b)
  })
})

// Get display name for catalog
function getCatalogDisplayName(catalog: string) {
  if (catalog === 'null')
    return 'Other Packages'
  if (catalog === 'default')
    return 'Default Catalog'
  return `Catalog: ${catalog}`
}
</script>

<template>
  <div flex="~ col gap-1">
    <template v-if="props.groupByCatalog && props.depth === 1">
      <template v-for="catalog in sortedCatalogKeys" :key="catalog">
        <!-- Display catalog header -->
        <div class="catalog-header" font-bold text-sm op50 mt2 mb1>
          {{ getCatalogDisplayName(catalog) }}
        </div>

        <template v-for="{ pkg, children } of groupedTree[catalog]" :key="pkg.spec">
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
                :sort-by="props.sortBy"
                :group-by-catalog="props.groupByCatalog"
              />
            </RenderNextTick>
            <div v-else-if="props.maxDepth > 2" ml6>
              <span op50 px2 bg-active rounded text-sm>
                {{ children?.length }} more ···
              </span>
            </div>
          </template>
        </template>
      </template>
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
              :sort-by="props.sortBy"
              :group-by-catalog="props.groupByCatalog"
            />
          </RenderNextTick>
          <div v-else-if="props.maxDepth > 2" ml6>
            <span op50 px2 bg-active rounded text-sm>
              {{ children?.length }} more ···
            </span>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

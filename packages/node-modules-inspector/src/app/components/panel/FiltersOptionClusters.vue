<script setup lang="ts">
import type { WritableComputedRef } from 'vue'
import { computed } from 'vue'
import { filters } from '../../state/filters'
import { payloads } from '../../state/payload'

const clustersAvailableSelect = computed(() => {
  const clusters = new Set<string>()
  for (const c of payloads.available.clusters) {
    if (!c.startsWith('dep:'))
      clusters.add(c)
  }
  return Array.from(clusters)
})

const clusterAll = computed<boolean>({
  get() {
    return filters.state.clusters == null || filters.state.clusters.length === clustersAvailableSelect.value.length
  },
  set(v) {
    if (v)
      filters.state.clusters = null
    else
      filters.state.clusters = []
  },
})

function createClusterRef(name: string) {
  return computed<boolean>({
    get() {
      return filters.state.clusters == null || filters.state.clusters.includes(name)
    },
    set(v) {
      const current = new Set(filters.state.clusters ? filters.state.clusters : clustersAvailableSelect.value)
      if (v)
        current.add(name)
      else
        current.delete(name)

      if (current.size >= clustersAvailableSelect.value.length) {
        filters.state.clusters = null
      }
      else {
        filters.state.clusters = Array.from(current)
      }
    },
  })
}

function selectOnly(cluster: string) {
  filters.state.clusters = [cluster]
}

const clusters = Object.fromEntries(
  clustersAvailableSelect.value.map(x => [x, createClusterRef(x)] as const),
) as Record<string, WritableComputedRef<boolean>>
</script>

<template>
  <div v-if="clustersAvailableSelect.length >= 2" flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center" h-6>
      <div
        v-tooltip="'Clusters are groups of packages that are introduced together by some conditions, such as pnpm catalogs'"
        flex="~ gap-2 items-center"
      >
        <div i-ph-exclude-duotone flex-none />
        <div>Clusters</div>
      </div>
      <div flex-auto />
      <OptionSelectGroup
        v-if="(filters.state.clusters?.length || 0) > 1"
        v-model="filters.state.clustersMode"
        :options="['and', 'or']"
        :titles="['AND', 'OR']"
      />
      <label flex="~ gap-1 items-center">
        <OptionCheckbox
          v-model="clusterAll"
        />
        <div>
          All
        </div>
      </label>
    </div>
    <div flex="~ gap-x-4 gap-y-2 wrap" mt1>
      <label
        v-for="type of clustersAvailableSelect"
        :key="type"
        flex="~ gap-1 items-center" select-none
        @dblclick.prevent="selectOnly(type)"
      >
        <OptionCheckbox
          v-model="clusters[type]!.value"
        />
        <DisplayClusterBadge
          select-none
          :cluster="type"
          :force="true"
          :class="clusters[type]!.value ? '' : 'saturate-0 op75'"
        />
      </label>
    </div>
  </div>
</template>

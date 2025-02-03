<script setup lang="ts">
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { filteredPackages } from '~/state/filters'

const top20 = computed(() => {
  return Array.from(filteredPackages.value)
    .filter(x => !x.workspace)
    .sort((a, b) => b.flatDependencies.size - a.flatDependencies.size)
    .slice(0, 20)
})
</script>

<template>
  <div grid="~ cols-[max-content_max-content_1fr] gap-x-4 gap-y-1" border="~ rounded-xl base" p4 bg-glass>
    <template v-for="pkg of top20" :key="pkg.spec">
      <button
        font-mono text-left hover:bg-active px2 ml--2 rounded
        @click="selectedNode = pkg"
      >
        <DisplayPackageSpec :pkg />
      </button>
      <div flex="~ justify-end items-center">
        <DisplayNumberBadge
          :number="pkg.flatDependencies.size"
          rounded-full text-sm h-max
        />
      </div>
      <ModuleTypePercentage :pkg="pkg" :flat="true" />
    </template>
  </div>
</template>

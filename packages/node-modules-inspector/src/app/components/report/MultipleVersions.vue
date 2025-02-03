<script setup lang="ts">
import { computed } from 'vue'
import { compareSemver } from '~~/shared/utils'
import { selectedNode } from '~/state/current'
import { filteredPackages } from '~/state/filters'
import { buildVersionToPackagesMap } from '~/utils/maps'

const versionMap = computed(() => buildVersionToPackagesMap(filteredPackages.value))
const duplicated = computed(() => Array.from(versionMap.value.values())
  .filter(packages => packages.length > 1)
  .sort((a, b) => b.length - a.length))

const sorted = computed(() => duplicated.value.map((packages) => {
  return packages.sort((a, b) => compareSemver(a.version, b.version))
}))
</script>

<template>
  <div grid="~ cols-minmax-200px gap-4">
    <div
      v-for="pkgs of sorted" :key="pkgs[0].spec"
      border="~ base rounded-lg" bg-glass
      flex="~ col"
      :class="selectedNode && pkgs.includes(selectedNode) ? 'border-primary ring-4 ring-primary:20' : ''"
    >
      <h2 font-mono p2 px3 border="b base">
        {{ pkgs[0].name }}
      </h2>
      <div flex="~ col gap-1" p2>
        <button
          v-for="pkg of pkgs" :key="pkg.version"
          px2 rounded flex="~ items-center gap-04"
          font-mono hover="bg-active"
          :class="selectedNode === pkg ? 'bg-active' : ''"
          @click="selectedNode = pkg"
        >
          <span op75 flex-auto text-left>v{{ pkg.version }}</span>
          <DisplayModuleType :pkg :badge="false" text-xs />
        </button>
      </div>
    </div>
  </div>
</template>

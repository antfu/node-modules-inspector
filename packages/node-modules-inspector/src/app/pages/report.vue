<script setup lang="ts">
import { compareSemver } from '~~/shared/utils'
import { selectedNode } from '~/state/current'
import { packageVersionsMap } from '~/state/data'

const duplicated = Array.from(packageVersionsMap.values())
  .filter(packages => packages.length > 1)
  .sort((a, b) => b.length - a.length)

duplicated.forEach((packages) => {
  packages.sort((a, b) => compareSemver(a.version, b.version))
})
</script>

<template>
  <CanvasContainer>
    <SubTitle>Packages with multiple versions</SubTitle>
    <div grid="~ cols-minmax-200px gap-4">
      <div
        v-for="pkgs of duplicated" :key="pkgs[0].spec"
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
            <ModuleTypeLabel :pkg :badge="false" text-xs />
          </button>
        </div>
      </div>
    </div>
  </CanvasContainer>
</template>

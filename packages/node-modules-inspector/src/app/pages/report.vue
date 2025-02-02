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
  <div pt-14 pl-120 pr-10>
    <SubTitle>Packages with multiple versions</SubTitle>
    <div grid="~ cols-minmax-250px gap-2">
      <div
        v-for="pkgs of duplicated" :key="pkgs[0].spec"
        border="~ base rounded-lg" px3 py2 bg-glass
        flex="~ col gap-2 "
      >
        <h2 font-mono>
          {{ pkgs[0].name }}
        </h2>
        <div flex="~ col gap-2 items-start">
          <button
            v-for="pkg in pkgs" :key="pkg.version"
            px1 rounded flex="~ items-center gap-1"
            font-mono hover="bg-active"
            @click="selectedNode = pkg"
          >
            <span op75>v{{ pkg.version }}</span>
            <ModuleTypeLabel :pkg />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

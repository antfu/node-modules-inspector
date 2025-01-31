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
  <div pt-14 pl-100>
    <h1>Packages with multiple versions</h1>
    <div grid="~ cols-minmax-400px gap-2">
      <div
        v-for="pkgs of duplicated" :key="pkgs[0].spec"
        border="~ base rounded" p2
        flex="~ col gap-2 "
      >
        <h2 font-mono text-primary>
          {{ pkgs[0].name }}
        </h2>
        <div flex="~ col gap-2 items-start">
          <button
            v-for="pkg in pkgs" :key="pkg.version"
            px1 rounded flex="~ items-center gap-1"
            font-mono hover="bg-active"
            @click="selectedNode = pkg"
          >
            v{{ pkg.version }}
            <ModuleTypeLabel :type="pkg.resolved.module" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { useRouter } from '#app/composables/router'
import { DisplayDateBadge } from '#components'
import { computed, nextTick } from 'vue'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'
import { payloads } from '~/state/payload'
import { settings } from '~/state/settings'
import { compareSemver } from '~/utils/semver'

const router = useRouter()

const duplicated = computed(() => Array.from(payloads.filtered.versions.values())
  .filter(packages => packages.length > 1)
  .sort((a, b) => b.length - a.length))

const sorted = computed(() => duplicated.value.map((packages) => {
  return packages.sort((a, b) => compareSemver(a.version, b.version))
}))

function showGraph(pkgs: PackageNode[]) {
  filters.state.focus = null
  filters.state.why = pkgs.map(pkg => pkg.spec)
  selectedNode.value = pkgs[0]
  nextTick(() => {
    router.push({ path: '/graph', hash: location.hash })
  })
}
</script>

<template>
  <template v-if="sorted.length">
    <UiSubTitle>
      Multi-Versions Packages
      <DisplayNumberBadge :number="sorted.length" rounded-full text-sm />
    </UiSubTitle>
    <div badge-color-primary flex="~ gap-2 items-center" rounded-lg p2 my2 px3>
      <div i-ph-lightbulb-duotone flex-none />
      <span>Run <code color-primary bg-primary:10 rounded px1 py0.5>pnpm dedupe</code> to de-duplicate packages that satisfies with the ranges</span>
    </div>
    <div grid="~ cols-minmax-200px gap-4">
      <div
        v-for="pkgs of sorted" :key="pkgs[0].spec"
        border="~ base rounded-lg" bg-glass
        flex="~ col"
        :class="selectedNode && pkgs.includes(selectedNode) ? 'border-primary ring-4 ring-primary:20' : ''"
      >
        <div flex="~ items-center gap-2" border="b base" px2 py1>
          <h2 font-mono flex-auto pl2>
            {{ pkgs[0].name }}
          </h2>
          <button
            p1 rounded-full op50 hover:bg-active hover:text-primary hover:op100 flex="~ items-center"
            title="Show Graph"
            @click="showGraph(pkgs)"
          >
            <div i-ph-graph-duotone text-lg />
          </button>
        </div>
        <div flex="~ col gap-1" p2>
          <button
            v-for="pkg of pkgs" :key="pkg.version"
            px2 rounded flex="~ items-center gap-2"
            font-mono hover="bg-active"
            :class="selectedNode === pkg ? 'bg-active' : ''"
            @click="selectedNode = pkg"
          >
            <span op75 flex-auto text-left>v{{ pkg.version }}</span>
            <DisplayDateBadge v-if="settings.showPublishTimeBadge" :pkg :badge="false" rounded-full text-xs />
            <DisplayModuleType :pkg :badge="false" text-xs />
          </button>
        </div>
      </div>
    </div>
  </template>
</template>

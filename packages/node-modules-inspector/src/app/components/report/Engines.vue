<script setup lang="ts">
import { DisplayNodeVersionRange } from '#components'
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import { compareSemverRange, parseSemverRange } from '../../utils/semver'

const transitiveDeps = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => x.resolved.packageJson.engines?.node && parseSemverRange(x.resolved.packageJson.engines?.node).valid)
    .sort((a, b) => compareSemverRange(a.resolved.packageJson.engines!.node, b.resolved.packageJson.engines!.node)),
)
</script>

<template>
  <ReportExpendableContainer
    v-if="transitiveDeps.length"
    :list="transitiveDeps"
    :title="['Newest Node.js Requirements', 'Oldest Node.js Requirements']"
  >
    <template #default="{ items }">
      <div grid="~ cols-[1fr_max-content] gap-x-4 gap-y-1">
        <div />
        <div text-sm op-fade text-right>
          Engines
        </div>

        <template v-for="pkg of items" :key="pkg.spec">
          <button
            font-mono text-left hover:bg-active px2 ml--2 rounded
            flex="~ gap-2 items-center"
            @click="selectedNode = pkg"
          >
            <DisplayModuleType :pkg />
            <DisplayPackageSpec :pkg />
          </button>
          <div flex justify-end>
            <DisplayNodeVersionRange h-max :range="pkg.resolved.packageJson.engines?.node" />
          </div>
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
</template>

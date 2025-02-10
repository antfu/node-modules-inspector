<script setup lang="ts">
import { DisplayNodeVersionRange } from '#components'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { payloads } from '~/state/payload'
import { compareSemverRange, parseSemverRange } from '../../utils/semver'

const transitiveDeps = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => x.resolved.engines?.node && parseSemverRange(x.resolved.engines?.node).valid)
    .sort((a, b) => compareSemverRange(a.resolved.engines!.node, b.resolved.engines!.node)),
)
</script>

<template>
  <div v-if="transitiveDeps.length">
    <UiSubTitle>
      Newest Node.js Requirements
      <DisplayNumberBadge :number="transitiveDeps.length" rounded-full text-sm />
    </UiSubTitle>
    <ReportExpendableContainer :list="transitiveDeps">
      <template #default="{ items }">
        <div grid="~ cols-[1fr_max-content] gap-x-4 gap-y-1">
          <template v-for="pkg of items" :key="pkg.spec">
            <button
              font-mono text-left hover:bg-active px2 ml--2 rounded
              @click="selectedNode = pkg"
            >
              <DisplayPackageSpec :pkg />
            </button>
            <div flex justify-end>
              <DisplayNodeVersionRange h-max :range="pkg.resolved.engines?.node" />
            </div>
          </template>
        </div>
      </template>
    </ReportExpendableContainer>
  </div>
</template>

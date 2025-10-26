<script setup lang="ts">
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'

const transitiveDeps = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => !x.workspace && payloads.available.flatDependents(x).length)
    .sort((a, b) => payloads.available.flatDependents(b).length - payloads.available.flatDependents(a).length),
)
</script>

<template>
  <div>
    <ReportExpendableContainer
      v-if="transitiveDeps.length"
      :list="transitiveDeps"
      :title="['Most Used By', 'Least Used By']"
    >
      <template #default="{ items }">
        <div grid="~ cols-[1fr_max-content_max-content] gap-x-4 gap-y-1">
          <div />
          <div text-sm op-fade text-center>
            Direct
          </div>
          <div text-sm op-fade text-center>
            Transitive
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
            <div flex="~ justify-end items-center gap-1">
              <DisplayNumberBadge
                :number="payloads.available.dependents(pkg).length"
                rounded-full text-sm h-max
              />
            </div>
            <div flex="~ justify-end items-center gap-1">
              <DisplayNumberBadge
                :number="payloads.available.flatDependents(pkg).length"
                rounded-full text-sm h-max
              />
            </div>
            <!-- <UiPercentageDepth :pkg="pkg" :flat="true" /> -->
          </template>
        </div>
      </template>
    </ReportExpendableContainer>
    <template v-else>
      <UiEmptyState
        title="No Used By Packages"
        message="No packages are being used by other dependencies"
      />
    </template>
  </div>
</template>

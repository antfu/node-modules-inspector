<script setup lang="ts">
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'

const transitiveDeps = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => !x.workspace && payloads.avaliable.flatDependencies(x).length)
    .sort((a, b) => payloads.avaliable.flatDependencies(b).length - payloads.avaliable.flatDependencies(a).length),
)
</script>

<template>
  <ReportExpendableContainer
    v-if="transitiveDeps.length"
    :list="transitiveDeps"
    :title="['Most Transitive Dependencies', 'Least Transitive Dependencies']"
  >
    <template #default="{ items }">
      <div grid="~ cols-[max-content_max-content_1fr] gap-x-4 gap-y-1">
        <div />
        <div text-sm op-fade text-center>
          Deps
        </div>
        <div text-sm op-fade text-right>
          Dependencies Composition
        </div>

        <template v-for="pkg of items" :key="pkg.spec">
          <button
            font-mono text-left hover:bg-active px2 ml--2 rounded
            @click="selectedNode = pkg"
          >
            <DisplayPackageSpec :pkg />
          </button>
          <div flex="~ justify-end items-center">
            <DisplayNumberBadge
              :number="payloads.avaliable.flatDependencies(pkg).length"
              rounded-full text-sm h-max
            />
          </div>
          <UiPercentageModuleType :pkg="pkg" :flat="true" />
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
  <template v-else>
    <UiEmptyState
      title="No Transitive Dependencies"
      message="No packages with transitive dependencies found"
    />
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { selectedNode } from '~/state/current'
import { payloads } from '~/state/payload'

const revert = ref(false)

const transitiveDeps = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => !x.workspace && payloads.avaliable.flatDependents(x).length)
    .sort((a, b) => revert.value ? payloads.avaliable.flatDependents(a).length - payloads.avaliable.flatDependents(b).length : payloads.avaliable.flatDependents(b).length - payloads.avaliable.flatDependents(a).length),
)
</script>

<template>
  <div v-if="transitiveDeps.length">
    <UiSubTitle>
      {{ revert ? 'Least' : 'Most' }} Used By
      <DisplayNumberBadge :number="transitiveDeps.length" rounded-full text-sm />
      <button
        title="Revert Sort"
        ml-a w-8 h-8 rounded-full hover:bg-active flex
        @click="revert = !revert"
      >
        <div v-if="!revert" i-ph-sort-descending ma />
        <div v-else i-ph-sort-ascending ma />
      </button>
    </UiSubTitle>
    <ReportExpendableContainer :list="transitiveDeps">
      <template #default="{ items }">
        <div grid="~ cols-[max-content_max-content_1fr] gap-x-4 gap-y-1">
          <template v-for="pkg of items" :key="pkg.spec">
            <button
              font-mono text-left hover:bg-active px2 ml--2 rounded
              @click="selectedNode = pkg"
            >
              <DisplayPackageSpec :pkg />
            </button>
            <div flex="~ justify-end items-center">
              <DisplayNumberBadge
                :number="payloads.avaliable.flatDependents(pkg).length"
                rounded-full text-sm h-max
              />
            </div>
            <UiPercentageModuleType :pkg="pkg" :flat="true" />
          </template>
        </div>
      </template>
    </ReportExpendableContainer>
  </div>
</template>

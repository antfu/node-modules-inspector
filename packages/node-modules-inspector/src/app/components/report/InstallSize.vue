<script setup lang="ts" generic="T">
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import DisplayFileSizeBadge from '../display/FileSizeBadge.vue'
import DisplayPackageSpec from '../display/PackageSpec.vue'
import UiEmptyState from '../ui/EmptyState.vue'
import UiPercentageFileCategories from '../ui/PercentageFileCategories.vue'
import ReportExpendableContainer from './ExpendableContainer.vue'

const sorted = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => x.resolved.installSize?.bytes)
    .sort((a, b) => b.resolved.installSize!.bytes - a.resolved.installSize!.bytes),
)
</script>

<template>
  <ReportExpendableContainer
    v-if="sorted.length"
    :list="sorted"
    title="Largest Install Size"
  >
    <template #default="{ items }">
      <div grid="~ cols-[max-content_max-content_1fr] gap-x-4 gap-y-1">
        <div />
        <div text-sm op-fade text-center>
          Install Size
        </div>
        <div text-sm op-fade text-right>
          Files Composition
        </div>

        <template v-for="pkg of items" :key="pkg.spec">
          <button
            font-mono text-left hover:bg-hover px2 ml--2 rounded
            @click="selectedNode = pkg"
          >
            <DisplayPackageSpec :pkg />
          </button>
          <div flex="~ justify-end items-center">
            <DisplayFileSizeBadge
              :bytes="pkg.resolved.installSize!.bytes"
              rounded-full text-sm h-max
            />
          </div>
          <div>
            <UiPercentageFileCategories :pkg="pkg" />
          </div>
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
  <template v-else>
    <UiEmptyState
      title="No Install Size Information"
      message="No install size information available for packages"
    />
  </template>
</template>

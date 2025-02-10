<script setup lang="ts" generic="T">
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { payloads } from '~/state/payload'

const sorted = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => x.resolved.installSize?.bytes)
    .sort((a, b) => b.resolved.installSize!.bytes - a.resolved.installSize!.bytes),
)
</script>

<template>
  <div v-if="sorted.length">
    <UiSubTitle>
      Largest Install Size
      <DisplayNumberBadge :number="sorted.length" rounded-full text-sm />
    </UiSubTitle>
    <ReportExpendableContainer :list="sorted">
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
  </div>
</template>

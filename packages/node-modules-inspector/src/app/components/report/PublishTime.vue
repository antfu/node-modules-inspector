<script setup lang="ts">
import { DisplayDateBadge } from '#components'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { getPublishTime, payloads } from '~/state/payload'

const packages = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => getPublishTime(x))
    .sort((a, b) => +getPublishTime(a)! - +getPublishTime(b)!),
)
</script>

<template>
  <ReportExpendableContainer
    v-if="packages.length"
    :list="packages"
    :title="['Oldest Packages', 'Newest Packages']"
  >
    <template #default="{ items }">
      <div grid="~ cols-[1fr_max-content] gap-x-4 gap-y-1">
        <div />
        <div text-sm op50 text-right>
          Publish Time
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
            <DisplayDateBadge :pkg />
          </div>
        </template>
      </div>
    </template>
  </ReportExpendableContainer>
</template>

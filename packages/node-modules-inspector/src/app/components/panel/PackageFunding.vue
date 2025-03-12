<script setup lang="ts">
import type { ParsedFunding } from 'node-modules-tools'
import { Menu as VMenu } from 'floating-vue'

defineProps<{
  fundings: ParsedFunding[]
}>()
</script>

<template>
  <NuxtLink
    v-if="fundings?.length === 1"
    v-tooltip="'Open Funding Page'"
    :to="fundings[0].url"
    title="Open Funding Page"
    target="_blank"
    ml--1 w-8 h-8 rounded-full hover:bg-active flex
  >
    <div i-catppuccin-code-of-conduct icon-catppuccin ma />
  </NuxtLink>

  <VMenu v-else-if="fundings?.length" ml--1 w-8 h-8 rounded-full hover:bg-active flex>
    <div
      v-tooltip="'Show Fundings'"
      i-catppuccin-code-of-conduct icon-catppuccin ma
      title="Show Fundings"
    />
    <template #popper>
      <div flex="~ col" p1>
        <DisplayFundingEntry
          v-for="funding of fundings"
          :key="funding.url"
          :funding="funding"
          p2 rounded font-mono hover:bg-active
        />
      </div>
    </template>
  </VMenu>
</template>

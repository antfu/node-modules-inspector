<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'

defineProps<{
  fundings: PackageNode['resolved']['fundings']
}>()
</script>

<template>
  <NuxtLink
    v-if="fundings.length === 1"
    :to="fundings[0].url"
    title="Open Funding"
    target="_blank"
    ml--1 w-8 h-8 rounded-full hover:bg-active flex
  >
    <div i-catppuccin-code-of-conduct icon-catppuccin ma />
  </NuxtLink>

  <VMenu v-else ml--1 w-8 h-8 rounded-full hover:bg-active flex>
    <div i-catppuccin-code-of-conduct icon-catppuccin ma title="Show Fundings" />
    <template #popper>
      <div flex="~ col" p1>
        <DisplayFundingEntry
          v-for="funding of fundings" :key="funding.url" :funding="funding.url"
          p2 rounded font-mono hover:bg-active
        />
      </div>
    </template>
  </VMenu>
</template>

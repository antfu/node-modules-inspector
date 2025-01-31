<script setup lang="ts">
import { filters } from '../state/search'
</script>

<template>
  <div fixed right-4 top-4 z-100 flex="~ gap-4 col">
    <label
      bg-glass rounded-full border border-base shadow px4 py3 flex-none
      flex="~ items-center gap-1.5"
    >
      <div i-ph-magnifying-glass-duotone />
      <input
        v-model="filters.search"
        placeholder="Search to filter"
        w-50 bg-transparent outline-none
      >
    </label>
  </div>
</template>

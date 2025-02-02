<script setup lang="ts">
import { Menu as VMenu } from 'floating-vue'
import { activatedFilters, filters } from '../state/filters'
</script>

<template>
  <div fixed right-4 top-4 z-100 flex="~ gap-2 items-center">
    <label
      bg-glass rounded-full border border-base shadow pl4 pr3 py2 flex-none
      flex="~ items-center gap-1.5"
    >
      <div i-ph-magnifying-glass-duotone />
      <input
        v-model="filters.search"
        placeholder="Search to filter"
        w-50 bg-transparent outline-none
      >
      <button
        w-6 h-6 rounded-full hover:bg-active flex
        :class="filters.search ? '' : 'op0'"
        @click="filters.search = ''"
      >
        <div i-ph-x ma />
      </button>
    </label>
    <div
      bg-glass rounded-full border border-base shadow flex-none
      flex="~ items-center gap-1" w-max relative
    >
      <VMenu placement="bottom-end">
        <button
          w-10 h-10 rounded-full hover:bg-active
          flex="~ items-center justify-center"
          title="Settings"
          :class="activatedFilters.length ? 'text-primary' : ''"
        >
          <div i-ph-funnel-duotone text-xl />
        </button>
        <template #popper>
          <div p4>
            Hello
          </div>
        </template>
      </VMenu>
      <div v-if="activatedFilters.length" absolute top-0 right-0 w-4 h-4 bg-primary shadow text-white rounded-full flex text-xs>
        <span ma>{{ activatedFilters.length }}</span>
      </div>
    </div>
  </div>
</template>

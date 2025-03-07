<script setup lang="ts">
import { filters } from '~/state/filters'
</script>

<template>
  <div>
    <div p4 flex="~ gap-2 items-center">
      <button
        btn-action :disabled="filters.select.activated.length === 0"
        @click="filters.select.reset()"
      >
        <div i-ph-funnel-x-duotone />
        Reset Filters
      </button>
    </div>

    <div flex="~ col gap-4" border="t base">
      <label
        p4 flex-none h-full
        flex="~ items-center gap-1.5"
        hover:bg-active
      >
        <div i-ph-text-t-duotone text-lg :class="filters.search ? 'text-primary' : 'op50'" flex-none />
        <input
          v-model="filters.state.search"
          placeholder="Filter by Text"
          w-full bg-transparent outline-none
        >
        <button
          w-6 h-6 rounded-full hover:bg-active flex
          :class="filters.state.search ? '' : 'op0'"
          @click="filters.state.search = ''"
        >
          <div i-ph-x ma op50 />
        </button>
      </label>
    </div>

    <div flex="~ col gap-4" p4 border="t base">
      <OptionItem title="Dependency Source" description="Filter by source type of the dependency">
        <OptionSelectGroup
          v-model="filters.state.sourceType"
          :options="[null, 'prod', 'dev']"
          :titles="['All', 'Prod', 'Dev']"
        />
      </OptionItem>
    </div>

    <PanelFiltersOptionModuleTypes />
    <PanelFiltersOptionClusters />

    <div v-if="filters.search.parsed.author?.length" flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-user-circle-duotone flex-none />
        <div>
          <div>Authors</div>
        </div>
      </div>
      <div flex="~ gap-2 wrap">
        <div
          v-for="author, idx of filters.search.parsed.author" :key="idx"
          font-mono text-sm badge-color-gray rounded-full px2 py0.5
          flex="~ gap-1 items-center"
        >
          {{ author.source }}
        </div>
      </div>
    </div>
    <div v-if="filters.search.parsed.license?.length" flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-file-text-duotone flex-none />
        <div>
          <div>License</div>
        </div>
      </div>
      <div flex="~ gap-2 wrap">
        <div
          v-for="license, idx of filters.search.parsed.license" :key="idx"
          font-mono text-sm badge-color-gray rounded-full px2 py0.5
          flex="~ gap-1 items-center"
        >
          {{ license.source }}
        </div>
      </div>
    </div>

    <PanelFiltersOptionFocus />
    <PanelFiltersOptionWhy />
    <PanelFiltersOptionDepth />
    <PanelFiltersResults />
  </div>
</template>

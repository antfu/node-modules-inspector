<script setup lang="ts">
import { useRoute } from '#app/composables/router'
import { computed } from 'vue'
import { query } from '~/state/query'
import { toggleDark } from '../../composables/dark'
import { selectedNode } from '../../state/current'
import { activatedFilters, filters } from '../../state/filters'

const route = useRoute()
const isSettingOpen = computed({
  get() {
    return query.selected === '~settings'
  },
  set(value) {
    if (!value && query.selected === '~settings')
      query.selected = ''
    else if (value)
      query.selected = '~settings'
  },
})
const isFiltersOpen = computed({
  get() {
    return query.selected === '~filters'
  },
  set(value) {
    if (!value && query.selected === '~filters')
      query.selected = ''
    else if (value)
      query.selected = '~filters'
  },
})

const tabsMeta = [
  {
    name: 'Graph View',
    path: '/graph',
    icon: 'i-ph-tree-structure-duotone',
  },
  {
    name: 'Grid View',
    path: '/grid',
    icon: 'i-ph-grid-nine-duotone',
  },
  {
    name: 'Report View',
    path: '/report',
    icon: 'i-ph-projector-screen-chart-duotone',
  },
]

function resetPanelState() {
  isSettingOpen.value = false
  isFiltersOpen.value = false
}
</script>

<template>
  <div
    fixed right-4 top-4 z-100 flex="~ gap-4 items-center"
    bg-glass rounded-full border border-base shadow
  >
    <button
      w-10 h-10 rounded-full hover:bg-active op50 hover:op100
      flex="~ items-center justify-center"
      title="Settings"
      @click="toggleDark()"
    >
      <div i-ph-sun-duotone dark:i-ph-moon-duotone text-xl />
    </button>
  </div>

  <div fixed left-4 top-4 z-100 flex="~ gap-3 items-center">
    <div
      bg-glass rounded-full border border-base shadow px3 py2 flex-none
      flex="~ items-center gap-1" w-max
    >
      <template v-for="tab of tabsMeta" :key="tab.value">
        <RouterLink
          w-10 h-10 rounded-full hover:bg-active
          flex="~ items-center justify-center"
          :title="tab.name"
          :class="route.path.startsWith(tab.path) ? 'text-primary' : 'op50'"
          :to="{ path: tab.path, query: route.query }"
          @click="resetPanelState()"
        >
          <div :class="tab.icon" text-xl />
        </RouterLink>
      </template>

      <!-- Filters -->
      <div w-1px h-20px mx2 border="l base" />
      <div relative>
        <button
          w-10 h-10 rounded-full hover:bg-active
          flex="~ items-center justify-center"
          title="Settings"
          :class="isFiltersOpen ? 'text-primary' : 'op50'"
          @click="isFiltersOpen = !isFiltersOpen"
        >
          <div i-ph-funnel-duotone text-xl />
        </button>
        <div v-if="activatedFilters.length" absolute top--1 right--1 w-4 h-4 bg-primary-600 shadow text-white rounded-full flex text-0.6rem>
          <span ma>{{ activatedFilters.length }}</span>
        </div>
      </div>
      <button
        w-10 h-10 rounded-full hover:bg-active
        flex="~ items-center justify-center"
        title="Settings"
        :class="isSettingOpen ? 'text-primary' : 'op50'"
        @click="isSettingOpen = !isSettingOpen"
      >
        <div i-ph-gear-six-duotone text-xl />
      </button>
    </div>
    <div
      bg-glass rounded-full border border-base shadow transition-all duration-300
      h-12
      focus-within="ring-4 ring-primary:20 w-60"
      :class="filters.search ? 'border-primary w-60' : 'w-12'"
    >
      <label
        p3 flex-none rounded-full h-full
        flex="~ items-center gap-1.5"
        hover:bg-active
      >
        <div i-ph-magnifying-glass-duotone text-lg :class="filters.search ? 'text-primary' : 'op50'" flex-none />
        <input
          v-model="filters.search"
          placeholder="Search to filter"
          w-full bg-transparent outline-none
        >
        <button
          w-6 h-6 rounded-full hover:bg-active flex
          :class="filters.search ? '' : 'op0'"
          @click="filters.search = ''"
        >
          <div i-ph-x ma op50 />
        </button>
      </label>
    </div>
  </div>
  <div
    fixed left-4 top-22 w-100 z-100 flex="~ gap-4 col" of-hidden
    style="max-height: calc(100vh - 6.5rem);"
  >
    <div
      bg-glass rounded-1em border border-base shadow of-y-auto
      h-max max-h-full
    >
      <PanelSettings
        v-if="isSettingOpen"
      />
      <PanelFilters
        v-else-if="isFiltersOpen"
      />
      <PanelPackageDetails
        v-else-if="selectedNode"
        :pkg="selectedNode"
      />
      <PanelOverview
        v-else
      />
    </div>
  </div>
</template>

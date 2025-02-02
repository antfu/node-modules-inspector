<script setup lang="ts">
import { useRoute } from '#app/composables/router'
import { computed } from 'vue'
import { query } from '~/state/query'
import { toggleDark } from '../composables/dark'
import { selectedNode } from '../state/current'

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
</script>

<template>
  <div fixed left-4 top-4 bottom-4 w-100 z-100 flex="~ gap-4 col" of-hidden>
    <div
      bg-glass rounded-full border border-base shadow px3 py2 flex-none
      flex="~ items-center gap-1" w-max
    >
      <template v-for="tab of tabsMeta" :key="tab.value">
        <RouterLink
          w-10 h-10 rounded-full hover:bg-active
          flex="~ items-center justify-center"
          :title="tab.name"
          :class="(route.path.startsWith(tab.path) && !isSettingOpen) ? 'text-primary' : 'op50'"
          :to="{ path: tab.path, query: route.query }"
          @click="isSettingOpen = false"
        >
          <div :class="tab.icon" text-xl />
        </RouterLink>
      </template>
      <div w-1px h-20px mx2 border="l base" />
      <button
        w-10 h-10 rounded-full hover:bg-active
        flex="~ items-center justify-center"
        title="Settings"
        :class="isSettingOpen ? 'text-primary' : 'op50'"
        @click="isSettingOpen = !isSettingOpen"
      >
        <div i-ph-gear-six-duotone text-xl />
      </button>
      <button
        w-10 h-10 rounded-full hover:bg-active op50 hover:op100
        flex="~ items-center justify-center"
        title="Settings"
        @click="toggleDark()"
      >
        <div i-ph-sun-duotone dark:i-ph-moon-duotone text-xl />
      </button>
    </div>
    <div
      bg-glass rounded-1em border border-base shadow of-y-auto
      h-max max-h-full
    >
      <SettingsPanel
        v-if="isSettingOpen"
      />
      <PackageInfoDetailed
        v-else-if="selectedNode"
        :pkg="selectedNode"
      />
      <OverviewPanel
        v-else
      />
    </div>
  </div>
</template>

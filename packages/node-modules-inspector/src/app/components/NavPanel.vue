<script setup lang="ts">
import { useRoute } from '#app/composables/router'
import { ref } from 'vue'
import { selectedNode } from '../state/current'

const route = useRoute()
const isSettingOpen = ref(false)

const tabsMeta = [
  {
    name: 'Tree View',
    path: '/tree',
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
        <NuxtLink
          w-10 h-10 rounded-full hover:bg-active
          flex="~ items-center justify-center"
          :title="tab.name"
          :class="(route.path.startsWith(tab.path) && !isSettingOpen) ? 'text-primary' : 'op50'"
          :to="tab.path"
          @click="isSettingOpen = false"
        >
          <div :class="tab.icon" text-xl />
        </NuxtLink>
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
    </div>
    <div v-if="selectedNode || isSettingOpen" bg-glass rounded-1em border border-base shadow p5 flex-auto of-y-auto>
      <div v-if="isSettingOpen">
        <div>Settings</div>
      </div>
      <PackageInfoDetailed
        v-else-if="selectedNode"
        :pkg="selectedNode"
      />
    </div>
  </div>
</template>

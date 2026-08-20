<script setup lang="ts">
import ActionIconButton from '@antfu/design/components/Action/ActionIconButton.vue'
import { useRoute } from '#app/composables/router'
import { selectedNode } from '../../state/current'
import { rawPayload } from '../../state/data'
import { filters } from '../../state/filters'
import { settings } from '../../state/settings'
import { isFiltersOpen, isSettingOpen, isSidepanelCollapsed } from '../../state/ui'
import PanelFilters from './Filters.vue'
import PanelGoto from './Goto.vue'
import PanelOverview from './Overview.vue'
import PanelPackageDetails from './PackageDetails.vue'
import PanelSettings from './Settings.vue'

const isWeb = import.meta.env.BACKEND === 'web'

const route = useRoute()
const location = window.location

const tabsMeta = [
  {
    name: 'Graph View',
    path: '/graph',
    icon: 'i-ph-tree-structure-duotone',
  },
  {
    name: 'Grid View',
    path: '/grid/depth',
    icon: 'i-ph-grid-nine-duotone',
  },
  {
    name: 'Report View',
    path: '/report',
    icon: 'i-ph-projector-screen-chart-duotone',
  },
  {
    name: 'Chart View',
    path: '/chart',
    icon: 'i-ph-chart-donut-duotone',
  },
  {
    name: 'Compare',
    path: '/compare',
    icon: 'i-ph-flip-horizontal-duotone',
  },
]

function resetPanelState() {
  isSettingOpen.value = false
  isFiltersOpen.value = false
}

function onPanelHover() {
  if (isSidepanelCollapsed.value)
    settings.value.collapseSidepanel = false
}

function toggleSetting() {
  isSettingOpen.value = !isSettingOpen.value
}

function toggleFilters() {
  isFiltersOpen.value = !isFiltersOpen.value
}

function newInspect() {
  // Registry (Instant) mode has no expensive state to lose; only the
  // WebContainer sandbox install warrants a confirmation.
  // eslint-disable-next-line no-alert
  if (rawPayload.value?.packageManager === 'npm-registry' || confirm('To start a new inspect, the current state will be lost. Continue?')) {
    location.href = '/'
  }
}
</script>

<template>
  <div
    fixed left-4 top-22 w-100 z-panel-content flex="~ gap-4 col" of-hidden
    transition-transform duration-300
    style="max-height: calc(100vh - 6.5rem);"
    :class="isSidepanelCollapsed ? 'translate-x--99.9' : ''"
    @mouseenter="onPanelHover"
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

  <div fixed left-4 top-4 flex="~ gap-3 items-center" z-panel-nav>
    <div
      bg-glass rounded-full border border-base shadow px3 py2 flex-none
      flex="~ items-center gap-1" w-max
    >
      <template v-if="isWeb && rawPayload">
        <ActionIconButton
          class="w-10 h-10"
          tooltip="Start a new inspect"
          icon="i-ph-caret-left"
          @click="newInspect()"
        />
        <div w-1px h-20px mx1 border="l base" />
      </template>

      <template v-for="tab of tabsMeta" :key="tab.path">
        <RouterLink
          v-tooltip="tab.name"
          w-10 h-10 rounded-full hover:bg-hover
          flex="~ items-center justify-center"
          :title="tab.name"
          :class="route.path.startsWith(tab.path) ? 'text-primary' : 'op-fade'"
          :to="{ path: tab.path, hash: location.hash }"
          @click="resetPanelState()"
        >
          <div :class="tab.icon" text-xl />
        </RouterLink>
      </template>

      <!-- Filters -->
      <div w-1px h-20px mx2 border="l base" />
      <div relative>
        <button
          w-10 h-10 rounded-full hover:bg-hover
          flex="~ items-center justify-center"
          title="Filters"
          :class="isFiltersOpen ? 'text-primary' : 'op-fade'"
          @click="toggleFilters()"
        >
          <div i-ph-funnel-duotone text-xl />
        </button>
        <div v-if="filters.select.activated.length" absolute top--1 right--1 w-4 h-4 bg-primary-600 shadow text-white rounded-full flex text-0.6rem>
          <span ma line-height-none>{{ filters.select.activated.length }}</span>
        </div>
      </div>
      <button
        w-10 h-10 rounded-full hover:bg-hover
        flex="~ items-center justify-center"
        title="Settings"
        :class="isSettingOpen ? 'text-primary' : 'op-fade'"
        @click="toggleSetting()"
      >
        <div i-ph-gear-six-duotone text-xl />
      </button>
    </div>
    <PanelGoto />
  </div>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { MaintainerActionItem } from '../../state/maintainer-actions'
import { computed, watch } from 'vue'
import { selectedAction } from '../../state/current'
import { fetchPublintMessages, rawPublintMessages } from '../../state/data'
import { filters } from '../../state/filters'
import { getMaintainerActionsFor, viewAllMaintainerActions } from '../../state/maintainer-actions'
import { payloads } from '../../state/payload'
import { query } from '../../state/query'
import { settings } from '../../state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const location = window.location

const isExcluded = computed(() => payloads.excluded.has(props.pkg))

const cluster = computed(() => [...payloads.available.flatClusters(props.pkg)].filter(i => !i.startsWith('dep:')))

const selectionMode = computed<'focus' | 'why' | 'exclude' | 'none'>({
  get() {
    if (filters.state.focus?.includes(props.pkg.spec))
      return 'focus'
    if (filters.state.why?.includes(props.pkg.spec))
      return 'why'
    if (filters.state.excludes?.includes(props.pkg.spec))
      return 'exclude'
    return 'none'
  },
  set(v) {
    filters.focus.toggle(props.pkg.spec, false)
    filters.why.toggle(props.pkg.spec, false)
    filters.excludes.toggle(props.pkg.spec, false)

    if (v === 'focus')
      filters.focus.toggle(props.pkg.spec, true)
    if (v === 'why')
      filters.why.toggle(props.pkg.spec, true)
    if (v === 'exclude')
      filters.excludes.toggle(props.pkg.spec, true)
  },
})

function getDepth(amount: number, min = 1) {
  if (!settings.value.deepDependenciesTree)
    return min
  if (amount > 200)
    return 3
  if (amount > 100)
    return 7
  return 10
}

const GROUP_BY_CYCLE = ['none', 'catalog', 'module'] as const

const groupByMeta = computed(() => {
  switch (settings.value.dependenciesGroupBy) {
    case 'catalog':
      return { icon: 'i-ph-exclude-duotone', label: 'Catalog' }
    case 'module':
      return { icon: 'i-ph-cube-duotone', label: 'Module' }
    default:
      return { icon: 'i-ph-list-duotone', label: 'None' }
  }
})

function cycleDependenciesGroupBy() {
  const idx = GROUP_BY_CYCLE.indexOf(settings.value.dependenciesGroupBy)
  settings.value.dependenciesGroupBy = GROUP_BY_CYCLE[(idx + 1) % GROUP_BY_CYCLE.length]!
}

const publint = computed(() => {
  if (props.pkg.resolved.publint)
    return props.pkg.resolved.publint
  if (rawPublintMessages.value?.has(props.pkg.spec))
    return rawPublintMessages.value.get(props.pkg.spec)
  return undefined
})

watch(
  publint,
  async (value) => {
    if (value === undefined)
      fetchPublintMessages(props.pkg)
  },
  { immediate: true },
)

const sizeInstall = computed(() => {
  return props.pkg.resolved.installSize?.bytes || 0
})

const sizeTotal = computed(() => {
  const deps = payloads.available.flatDependencies(props.pkg)
  if (!deps.length)
    return 0
  return [props.pkg, ...deps].reduce((acc, x) => acc + (x.resolved.installSize?.bytes || 0), 0)
})

function getShallowestDependents(pkg: PackageNode) {
  const dependents = payloads.available.flatDependents(pkg)
  if (!dependents.length)
    return []
  const minDepth = Math.min(...dependents.map(x => x.depth))
  return dependents.filter(x => x.depth === minDepth)
}

const maintainerActions = computed(() => getMaintainerActionsFor(props.pkg))
const maintainerActionsCount = computed(() => maintainerActions.value.length)

function openMaintainerAction(action: MaintainerActionItem) {
  viewAllMaintainerActions.value = false
  selectedAction.value = action
}

const thirdPartyServices = computed(() => {
  const links: {
    name: string
    description: string
    url: string
    icon?: string
    iconClass?: string
  }[] = []

  links.push({
    name: 'publint',
    description: 'Lint if a package is published right',
    url: `https://publint.dev/${props.pkg.spec}`,
    icon: '/3rd-parties/publint.svg',
  })

  links.push({
    name: 'arethetypeswrong',
    description: 'Check the types of the published package',
    url: `https://arethetypeswrong.github.io/?p=${encodeURIComponent(props.pkg.spec)}`,
    icon: '/3rd-parties/arethetypeswrong.png',
  })

  links.push({
    name: 'pkg-size.dev',
    description: 'Find the true size of an npm package. It also includes the bundle size of each exports.',
    url: `https://pkg-size.dev/${props.pkg.spec}`,
    icon: '/3rd-parties/pkg-size.svg',
  })

  links.push({
    name: 'snyk',
    description: 'Find vulnerabilities in your dependencies',
    url: `https://snyk.io/advisor/npm-package/${props.pkg.name}`,
    icon: '/3rd-parties/synk.png',
  })

  links.push({
    name: 'packagephobia',
    description: 'Find the size of an npm package',
    url: `https://packagephobia.com/result?p=${encodeURIComponent(props.pkg.spec)}`,
    icon: '/3rd-parties/packagephobia.png',
  })

  links.push({
    name: 'socket.dev',
    description: 'Secure your dependencies.',
    url: `https://socket.dev/npm/package/${props.pkg.name}/overview/${props.pkg.version}`,
    icon: '/3rd-parties/socket-dev.png',
  })

  links.push({
    name: 'npmgraph',
    description: 'Visualize the dependencies of an npm package',
    url: `https://npmgraph.js.org/?q=${encodeURIComponent(props.pkg.spec)}`,
    icon: '/3rd-parties/npmgraph.png',
    iconClass: 'dark:invert',
  })

  links.push({
    name: 'bundlejs',
    description: 'a quick npm package size checker',
    url: `https://bundlejs.com/?q=${encodeURIComponent(props.pkg.spec)}`,
    icon: '/3rd-parties/bundlejs.svg',
  })

  links.push({
    name: 'bundlephobia',
    description: 'find the cost of adding a npm package to your bundle',
    url: `https://bundlephobia.com/package/${props.pkg.spec}`,
    icon: '/3rd-parties/bundlephobia.png',
    iconClass: 'dark:invert',
  })

  return links
})
</script>

<template>
  <div v-if="pkg" of-hidden h-full flex="~ col gap-0">
    <div absolute top-2 right-2 flex="~ items-center gap-0">
      <button
        w-10 h-10 rounded-full
        op30
        hover="op100 bg-active"
        flex="~ items-center justify-center"
        @click="query.selected = undefined"
      >
        <div i-ph-x />
      </button>
    </div>

    <PanelPackageDetailsInfo :pkg p5 pb2 />
    <div v-if="cluster.length" px4 my2 flex="~ gap-2 wrap items-center">
      <DisplayClusterBadge v-for="c of cluster" :key="c" flex="~ items-center gap-1" :cluster="c" />
    </div>
    <DisplayDeprecationMessage :pkg="pkg" mt2 border-y-2 border-dashed />

    <div grid="~ cols-3 gap-2 items-center" p2>
      <button
        v-tooltip="'Focus on this package and the dependencies it brings'"
        flex="~ items-center gap-1 justify-center"
        px4 py1 rounded hover:bg-active
        :class="selectionMode === 'focus' ? 'text-teal bg-teal:10!' : 'op-fade'"
        @click="selectionMode = selectionMode === 'focus' ? 'none' : 'focus'"
      >
        <div i-ph-arrows-in-cardinal-duotone flex-none />
        <span>Focus</span>
      </button>
      <button
        v-tooltip="'Focus on the packages that brings this package'"
        flex="~ items-center gap-1 justify-center"
        px4 py1 rounded hover:bg-active
        :class="selectionMode === 'why' ? 'text-orange bg-orange:10!' : 'op-fade'"
        @click="selectionMode = selectionMode === 'why' ? 'none' : 'why'"
      >
        <div i-ph-seal-question-duotone flex-none />
        <span>Why</span>
      </button>
      <button
        v-tooltip="'Exclude this package and the dependencies it brings'"
        flex="~ items-center gap-1 justify-center" px4 py1 rounded
        hover:bg-active border="~ transparent"
        :class="[
          selectionMode === 'exclude'
            ? 'text-purple bg-purple:10!'
            : isExcluded
              ? 'border-dashed! border-purple:50!'
              : 'op-fade',
        ]"
        @click="selectionMode = selectionMode === 'exclude' ? 'none' : 'exclude'"
      >
        <div i-ph-network-slash-duotone flex-none />
        <span>Exclude</span>
      </button>
    </div>

    <div v-if="maintainerActionsCount" block border="t base">
      <button
        flex="~ gap-2 items-center" w-full p4 select-none
        @click="settings.showMaintainerActions = !settings.showMaintainerActions"
      >
        <div i-ph-pipe-wrench-duotone flex-none op-fade />
        <span op-fade text-sm>Maintainer actions</span>
        <DisplayNumberBadge :number="maintainerActionsCount" rounded-full text-sm color="badge-color-amber" />
        <div flex-auto />
        <NuxtLink
          v-tooltip="'Open Maintainer Actions report'"
          :to="{ path: '/report/maintainer-actions', hash: location.hash }"
          p1 rounded-full hover:bg-active
          @click.stop
        >
          <div i-ph-arrow-square-out op-fade />
        </NuxtLink>
        <div p1 mr--2 title="Toggle maintainer actions">
          <div i-ph-caret-down transition duration-300 :class="settings.showMaintainerActions ? 'op75' : 'rotate-90 op-mute'" />
        </div>
      </button>
      <div v-if="settings.showMaintainerActions" flex="~ col gap-1" px4 pb4 pt-0 mt--2>
        <button
          v-for="action of maintainerActions" :key="action.key"
          flex="~ items-center gap-2" w-full
          text-left text-sm
          hover:bg-active rounded px2 py1
          @click="openMaintainerAction(action)"
        >
          <PanelMaintainerActionTypePill :action="action" />
          <template v-if="action.kind === 'dep-upgrade'">
            <span font-mono op80 truncate>{{ action.depName }}</span>
            <span font-mono text-xs px1 rounded badge-color-gray>{{ action.declaredRange }}</span>
            <div i-ph-arrow-right op-mute text-xs flex-none />
            <span font-mono text-xs px1 rounded badge-color-green>v{{ action.installedHighestVersion }}</span>
          </template>
          <template v-else>
            <IntegrationsPublintCounts :messages="action.messages" />
          </template>
          <div flex-auto />
          <div i-ph-caret-right op-fade flex-none />
        </button>
      </div>
    </div>

    <div v-if="pkg.resolved.installSize" p4 border="t base" flex="~ col gap-1">
      <div
        flex="~ gap-3 wrap items-center" select-none
        @click="settings.showFileComposition = !settings.showFileComposition"
      >
        <div v-if="sizeInstall" flex="~ items-center gap-1">
          <div text-sm op-fade>
            Install
          </div>
          <DisplayFileSizeBadge :bytes="sizeInstall" rounded-lg />
        </div>
        <div v-if="sizeTotal" flex="~ items-center gap-1">
          <div text-sm op-fade>
            Total
          </div>
          <DisplayFileSizeBadge :bytes="sizeTotal" rounded-lg />
        </div>
        <div flex-auto />
        <button
          v-tooltip="'Toggle file composition'"
          p1 rounded-full hover:bg-active mr--2
          title="Toggle file composition"
        >
          <div i-ph-caret-down transition duration-300 :class="settings.showFileComposition ? 'op75' : 'rotate-90 op-mute'" />
        </button>
      </div>
      <div v-if="settings.showFileComposition" flex="~ gap-1 col">
        <div op-fade text-sm mt2>
          File Composition
        </div>
        <UiPercentageFileCategories :pkg="pkg" />
      </div>
    </div>

    <div v-if="thirdPartyServices.length" flex="~ col gap-2" p4 border="t base">
      <div
        flex="~ gap-3 wrap items-center" select-none
        @click="settings.showThirdPartyServices = !settings.showThirdPartyServices"
      >
        <div flex="~ items-center gap-1">
          <div text-sm op-fade>
            Learn more in other tools
          </div>
        </div>
        <div flex-auto />
        <button
          v-tooltip="'Toggle third party services'"
          p1 rounded-full hover:bg-active mr--2
          title="Toggle third party services"
        >
          <div i-ph-caret-down transition duration-300 :class="settings.showThirdPartyServices ? 'op75' : 'rotate-90 op-mute'" />
        </button>
      </div>
      <div v-if="settings.showThirdPartyServices" flex="~ gap-2 wrap">
        <a
          v-for="service of thirdPartyServices" :key="service.name"
          :href="service.url"
          target="_blank"
          flex="~ items-center gap-1"
          bg-active rounded-full px2
          op75 hover:op100
        >
          <img v-if="service.icon" :src="service.icon" w-4 h-4 rounded-sm :class="service.iconClass">
          <div v-tooltip="service.description" op75>
            {{ service.name }}
          </div>
        </a>
      </div>
    </div>

    <div flex="~" select-none h-10 mt-2>
      <div border="b base" w-2 />
      <button
        flex-1 border border-base rounded-t-lg p1 flex="~ items-center justify-center gap-1" transition-margin
        :class="settings.packageDetailsTab === 'dependents' ? 'text-primary border-b-transparent' : 'saturate-0 hover:bg-active mt-5px'"
        @click="settings.packageDetailsTab = 'dependents'"
      >
        <span :class="settings.packageDetailsTab === 'dependents' ? '' : 'op30'">Used by</span>
        <DisplayNumberBadge
          text-xs rounded-full
          :number="settings.deepDependenciesTree ? payloads.available.flatDependents(pkg).length : payloads.available.dependents(pkg).length"
        />
      </button>
      <div border="b base" w-2 />
      <button
        flex-1 border border-base rounded-t-lg p1 flex="~ items-center justify-center gap-1" transition-margin
        :class="settings.packageDetailsTab === 'dependencies' ? 'text-primary border-b-transparent' : 'saturate-0 hover:bg-active mt-5px'"
        @click="settings.packageDetailsTab = 'dependencies'"
      >
        <span :class="settings.packageDetailsTab === 'dependencies' ? '' : 'op30'">Deps on</span>
        <DisplayNumberBadge
          text-xs rounded-full
          :number="settings.deepDependenciesTree ? payloads.available.flatDependencies(pkg).length : payloads.available.dependencies(pkg).length"
        />
      </button>
      <div border="b base" pt2 px2 flex="~ items-center gap-1">
        <button
          v-tooltip="`Group dependencies by: ${groupByMeta.label}`"
          p1 rounded-full hover:bg-active
          :title="`Group dependencies by: ${groupByMeta.label}`"
          @click="cycleDependenciesGroupBy"
        >
          <div op75 :class="groupByMeta.icon" />
        </button>
        <button
          v-tooltip="'Toggle deep dependencies tree'"
          p1 rounded-full hover:bg-active
          title="Toggle deep dependencies tree"
          @click="settings.deepDependenciesTree = !settings.deepDependenciesTree"
        >
          <div op75 :class="settings.deepDependenciesTree ? 'i-ph-text-align-right-duotone' : 'i-ph-text-align-justify-duotone'" />
        </button>
      </div>
    </div>

    <div flex="~ col gap-1" flex-auto of-auto>
      <template v-if="settings.packageDetailsTab === 'dependents'">
        <template v-if="payloads.available.flatDependents(pkg).length">
          <TreeDependencies
            v-if="settings.deepDependenciesTree"
            py5 px4
            :currents="getShallowestDependents(pkg)"
            :list="payloads.available.flatDependents(pkg)"
            :max-depth="getDepth(payloads.available.flatDependents(pkg).length, 2)"
            :group-by="settings.dependenciesGroupBy"
            type="dependents"
          />
          <TreeDependencies
            v-else
            py5 px4
            :currents="payloads.available.dependents(pkg)"
            :list="payloads.available.dependents(pkg)"
            :max-depth="getDepth(payloads.available.dependents(pkg).length, 2)"
            :group-by="settings.dependenciesGroupBy"
            type="dependents"
          />
        </template>
        <div v-else op-mute italic text-center py3>
          No dependents
        </div>
      </template>
      <template v-else-if="settings.packageDetailsTab === 'dependencies'">
        <div p4 flex="~ col gap-1">
          <div op-fade text-sm mt1>
            Dependency Composition
          </div>
          <UiPercentageModuleType
            :pkg="pkg"
            :flat="settings.deepDependenciesTree"
          />
          <div op-fade text-sm mt2>
            Dependency Provenance
          </div>
          <UiPercentageProvenance
            :pkg="pkg"
            :flat="settings.deepDependenciesTree"
          />
        </div>

        <template v-if="payloads.available.flatDependencies(pkg).length">
          <TreeDependencies
            py5 pt2 px4
            :currents="payloads.available.dependencies(pkg)"
            :list="payloads.available.flatDependencies(pkg)"
            :max-depth="getDepth(payloads.available.flatDependencies(pkg).length)"
            :group-by="settings.dependenciesGroupBy"
            type="dependencies"
          />
        </template>
        <div v-else op-mute italic text-center pb4>
          No dependencies
        </div>
      </template>
    </div>
  </div>
</template>

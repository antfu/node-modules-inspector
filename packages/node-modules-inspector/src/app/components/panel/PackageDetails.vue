<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Menu as VMenu } from 'floating-vue'
import { computed } from 'vue'
import { getBackend } from '~/backends'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'
import { getPublishTime, payloads } from '~/state/payload'
import { query } from '~/state/query'
import { settings } from '~/state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const backend = getBackend()

const duplicated = computed(() => {
  const value = payloads.filtered.versions.get(props.pkg.name)
  if (value && value?.length > 1)
    return value
  return undefined
})

const isExcluded = computed(() => payloads.excluded.has(props.pkg))

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

const sizeInstall = computed(() => {
  return props.pkg.resolved.installSize?.bytes || 0
})
const sizeTotal = computed(() => {
  const deps = payloads.avaliable.flatDependencies(props.pkg)
  if (!deps.length)
    return 0
  return [props.pkg, ...deps].reduce((acc, x) => acc + (x.resolved.installSize?.bytes || 0), 0)
})

function getShallowestDependents(pkg: PackageNode) {
  const dependents = payloads.avaliable.flatDependents(pkg)
  if (!dependents.length)
    return []
  const minDepth = Math.min(...dependents.map(x => x.depth))
  return dependents.filter(x => x.depth === minDepth)
}
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

    <div flex="~ col gap-2" p5 pb2>
      <div font-mono text-2xl flex="~ wrap items-center gap-2" pr20>
        <span>{{ pkg.name }}</span>
      </div>
      <div flex="~ items-center wrap gap-2">
        <DisplayVersion :version="pkg.version" op75 />
        <DisplayModuleType text-sm :pkg :force="true" />
        <div v-if="pkg.private" badge-color-gray px2 rounded text-sm border="~ base dashed">
          Private
        </div>
        <div v-if="pkg.workspace" badge-color-lime px2 rounded text-sm>
          Workspace
        </div>
        <DisplaySourceTypeBadge :pkg mode="both" />
        <VMenu v-if="duplicated" font-mono>
          <div pl2 pr1 rounded bg-rose:10 text-rose text-sm flex="~ items-center gap-1">
            {{ duplicated.length }} versions
            <div i-ph-caret-down text-xs />
          </div>
          <template #popper>
            <div flex="~ col" p1>
              <button
                v-for="versionNode of duplicated" :key="versionNode.version"
                py1 px2 rounded flex="~ items-center gap-1" min-w-40
                font-mono hover="bg-active"
                :class="selectedNode === versionNode ? 'text-primary' : ''"
                @click="selectedNode = versionNode"
              >
                <DisplayVersion op75 flex-auto text-left :version="versionNode.version" />
                <DisplayModuleType :force="true" :pkg="versionNode" :badge="false" text-xs />
              </button>
            </div>
          </template>
        </VMenu>
        <div flex="~ gap--1 items-center">
          <NuxtLink
            v-if="!pkg.private"
            :to="`https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`"
            title="Open on NPM"
            target="_blank"
            w-8 h-8 rounded-full hover:bg-active flex
          >
            <div i-catppuccin-npm icon-catppuccin ma />
          </NuxtLink>
          <NuxtLink
            v-if="pkg.resolved.repository?.match(/https?:\/\//)"
            :to="pkg.resolved.repository"
            title="Open Repository"
            target="_blank"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
          >
            <div i-catppuccin-git icon-catppuccin ma />
          </NuxtLink>
          <NuxtLink
            v-if="pkg.resolved.homepage"
            :to="pkg.resolved.homepage"
            title="Open Homepage"
            target="_blank"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
          >
            <div i-catppuccin-http icon-catppuccin ma />
          </NuxtLink>
          <PanelPackageFunding v-if="pkg.resolved.fundings.length" :fundings="pkg.resolved.fundings" />
          <NuxtLink
            :to="`https://publint.dev/${pkg.spec}`"
            title="Open in Publint"
            target="_blank"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
          >
            <div i-catppuccin-lib icon-catppuccin ma />
          </NuxtLink>
          <button
            v-if="backend?.functions.openInEditor"
            title="Open Package Folder in Editor"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
            @click="backend.functions.openInEditor(pkg.filepath)"
          >
            <div i-catppuccin-folder-vscode hover:i-catppuccin-folder-vscode-open icon-catppuccin ma />
          </button>
          <button
            v-if="backend?.functions.openInFinder"
            title="Open Package Folder in Finder"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
            @click="backend.functions.openInFinder(pkg.filepath)"
          >
            <div i-catppuccin-folder-command hover:i-catppuccin-folder-command-open icon-catppuccin ma />
          </button>
        </div>
      </div>
      <div flex="~ gap-2 wrap items-center">
        <span>{{ pkg.resolved.license }}</span>
        <template v-if="pkg.resolved.author">
          <span op50>·</span>
          <span>
            {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
          </span>
        </template>
        <template v-if="pkg.resolved.engines?.node">
          <span op50>·</span>
          <DisplayNodeVersionRange :range="pkg.resolved.engines?.node" />
        </template>
        <template v-if="getPublishTime(pkg)">
          <span op50>·</span>
          <DisplayDateBadge :pkg rounded-full text-sm />
        </template>
      </div>
    </div>
    <div grid="~ cols-3 gap-2 items-center" p2>
      <button
        v-tooltip="'Focus on this package and the dependencies it brings'"
        flex="~ items-center gap-1 justify-center"
        px4 py1 rounded hover:bg-active
        :class="selectionMode === 'focus' ? 'text-teal bg-teal:10!' : 'op50'"
        @click="selectionMode = selectionMode === 'focus' ? 'none' : 'focus'"
      >
        <div i-ph-arrows-in-cardinal-duotone flex-none />
        <span>Focus</span>
      </button>
      <button
        v-tooltip="'Focus on the packages that brings this package'"
        flex="~ items-center gap-1 justify-center"
        px4 py1 rounded hover:bg-active
        :class="selectionMode === 'why' ? 'text-orange bg-orange:10!' : 'op50'"
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
              : 'op50',
        ]"
        @click="selectionMode = selectionMode === 'exclude' ? 'none' : 'exclude'"
      >
        <div i-ph-network-slash-duotone flex-none />
        <span>Exclude</span>
      </button>
    </div>

    <div v-if="pkg.resolved.publint" border="t rounded base">
      <IntegrationsPublintPanel :pkg="pkg" />
    </div>

    <div v-if="pkg.resolved.installSize" p4 border="t base" flex="~ col gap-1">
      <div flex="~ gap-3 wrap items-center">
        <div v-if="sizeInstall" flex="~ items-center gap-1">
          <div text-sm op50>
            Install
          </div>
          <DisplayFileSizeBadge :bytes="sizeInstall" rounded-lg />
        </div>
        <div v-if="sizeTotal" flex="~ items-center gap-1">
          <div text-sm op50>
            Total
          </div>
          <DisplayFileSizeBadge :bytes="sizeTotal" rounded-lg />
        </div>
        <div flex-auto />
        <button
          p1 rounded-full hover:bg-active mr--2
          title="Toggle file composition"
          @click="settings.showFileComposition = !settings.showFileComposition"
        >
          <div i-ph-caret-down transition duration-300 :class="settings.showFileComposition ? 'op75' : 'rotate-90 op25'" />
        </button>
      </div>
      <div v-if="settings.showFileComposition" flex="~ gap-1 col">
        <div op50 text-sm mt2>
          File Composition
        </div>
        <UiPercentageFileCategories :pkg="pkg" />
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
          :number="settings.deepDependenciesTree ? payloads.avaliable.flatDependents(pkg).length : payloads.avaliable.dependents(pkg).length"
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
          :number="settings.deepDependenciesTree ? payloads.avaliable.flatDependencies(pkg).length : payloads.avaliable.dependencies(pkg).length"
        />
      </button>
      <div border="b base" pt2 px2>
        <button
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
        <template v-if="pkg.flatDependents.size">
          <TreeDependencies
            v-if="settings.deepDependenciesTree"
            py5 px4
            :currents="getShallowestDependents(pkg)"
            :list="payloads.avaliable.flatDependents(pkg)"
            :max-depth="getDepth(pkg.flatDependents.size, 2)"
            type="dependents"
          />
          <TreeDependencies
            v-else
            py5 px4
            :currents="payloads.avaliable.dependents(pkg)"
            :list="payloads.avaliable.dependents(pkg)"
            :max-depth="getDepth(pkg.dependents.size, 2)"
            type="dependents"
          />
        </template>
        <div v-else op25 italic text-center py3>
          No dependents
        </div>
      </template>
      <template v-else-if="settings.packageDetailsTab === 'dependencies'">
        <div p4 flex="~ col gap-1">
          <div op50 text-sm mt1>
            Dependency Composition
          </div>
          <UiPercentageModuleType
            :pkg="pkg"
            :flat="settings.deepDependenciesTree"
          />
        </div>

        <template v-if="pkg.flatDependencies.size">
          <TreeDependencies
            py5 pt2 px4
            :currents="payloads.avaliable.dependencies(pkg)"
            :list="payloads.avaliable.flatDependencies(pkg)"
            :max-depth="getDepth(pkg.flatDependencies.size)"
            type="dependencies"
          />
        </template>
        <div v-else op25 italic text-center pb4>
          No dependencies
        </div>
      </template>
    </div>
  </div>
</template>

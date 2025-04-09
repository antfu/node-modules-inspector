<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { useRouter } from '#app/composables/router'
import { Menu as VMenu } from 'floating-vue'
import { computed, nextTick, watch } from 'vue'
import { getBackend } from '../../backends'
import { selectedNode } from '../../state/current'
import { fetchPublintMessages, rawPublintMessages } from '../../state/data'
import { filters } from '../../state/filters'
import { getDeprecatedInfo, getNpmMetaLatest, getPublishTime, payloads } from '../../state/payload'
import { query } from '../../state/query'
import { settings } from '../../state/settings'
import { getPackageData } from '../../utils/package-json'

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

const resolved = computed(() => getPackageData(props.pkg))

const cluster = computed(() => [...payloads.avaliable.flatClusters(props.pkg)].filter(i => !i.startsWith('dep:')))

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

const latestMeta = computed(() => getNpmMetaLatest(props.pkg))
const deprecation = computed(() => getDeprecatedInfo(props.pkg))

const router = useRouter()
function showDuplicatedGraph(pkgs: PackageNode[]) {
  filters.state.focus = null
  filters.state.why = pkgs.map(pkg => pkg.spec)
  selectedNode.value = pkgs[0]
  nextTick(() => {
    router.push({ path: '/graph', hash: location.hash })
  })
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

    <div flex="~ col gap-2" p5 pb2>
      <DisplayPackageName
        :name="pkg.name"
        font-mono text-2xl flex="~ wrap items-center gap-2" pr20
        :class="deprecation?.latest ? deprecation.type === 'future' ? 'text-orange line-through' : 'text-red line-through' : ''"
      />
      <div text-sm op-fade line-clamp-3 text-ellipsis mt--1 mb1>
        {{ pkg.resolved?.packageJson?.description }}
      </div>
      <div flex="~ items-center wrap gap-2">
        <DisplayVersionWithUpdates
          :version="pkg.version"
          :latest="latestMeta"
        />
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
              <div border="t base" my1 />
              <button
                py1 px2 rounded flex="~ items-center gap-1" min-w-40
                hover="bg-active"
                @click="showDuplicatedGraph(duplicated)"
              >
                <div i-ph-graph-duotone />
                <span text-sm> Compare in Graph</span>
              </button>
            </div>
          </template>
        </VMenu>
        <div flex="~ gap--1 items-center">
          <NuxtLink
            v-if="!pkg.private"
            v-tooltip="'Open on NPM'"
            :to="`https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`"
            title="Open on NPM"
            target="_blank"
            w-8 h-8 rounded-full hover:bg-active flex
          >
            <div i-catppuccin-npm icon-catppuccin ma />
          </NuxtLink>
          <NuxtLink
            v-if="resolved.repository"
            v-tooltip="'Open Repository'"
            :to="resolved.repository"
            title="Open Repository"
            target="_blank"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
          >
            <div i-catppuccin-git icon-catppuccin ma />
          </NuxtLink>
          <NuxtLink
            v-if="resolved.homepage"
            v-tooltip="'Open Homepage'"
            :to="resolved.homepage"
            title="Open Homepage"
            target="_blank"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
          >
            <div i-catppuccin-http icon-catppuccin ma />
          </NuxtLink>
          <PanelPackageFunding
            v-if="resolved.fundings?.length"
            :fundings="resolved.fundings"
          />
          <button
            v-if="backend?.functions.openInEditor && pkg.filepath"
            v-tooltip="'Open Package Folder in Editor'"
            title="Open Package Folder in Editor"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
            @click="backend.functions.openInEditor(pkg.filepath)"
          >
            <div i-catppuccin-folder-vscode hover:i-catppuccin-folder-vscode-open icon-catppuccin ma />
          </button>
          <button
            v-if="backend?.functions.openInFinder && pkg.filepath"
            v-tooltip="'Open Package Folder in File Explorer'"
            title="Open Package Folder in File Explorer"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
            @click="backend.functions.openInFinder(pkg.filepath)"
          >
            <div i-catppuccin-folder-command hover:i-catppuccin-folder-command-open icon-catppuccin ma />
          </button>
        </div>
      </div>
      <div flex="~ gap-2 wrap items-center">
        <span>{{ resolved.license }}</span>
        <template v-if="resolved.authors?.length">
          <span op-fade>·</span>
          <template
            v-for="(author, idx) of resolved.authors"
            :key="author.name"
          >
            <span v-if="idx > 0" text-xs op-fade>&</span>
            <component
              :is="author.url ? 'a' : 'span'"
              :href="author.url"
              target="_blank"
            >
              {{ author.name }}
            </component>
          </template>
        </template>
        <template v-if="resolved.engines?.node">
          <span op-fade>·</span>
          <DisplayNodeVersionRange :range="resolved.engines?.node" />
        </template>
        <template v-if="getPublishTime(pkg)">
          <span op-fade>·</span>
          <DisplayDateBadge :pkg rounded-full text-sm />
        </template>
      </div>
    </div>
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

    <div v-if="publint" border="t rounded base">
      <IntegrationsPublintPanel :pkg="pkg" :messages="publint" />
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
        <template v-if="payloads.avaliable.flatDependents(pkg).length">
          <TreeDependencies
            v-if="settings.deepDependenciesTree"
            py5 px4
            :currents="getShallowestDependents(pkg)"
            :list="payloads.avaliable.flatDependents(pkg)"
            :max-depth="getDepth(payloads.avaliable.flatDependents(pkg).length, 2)"
            type="dependents"
          />
          <TreeDependencies
            v-else
            py5 px4
            :currents="payloads.avaliable.dependents(pkg)"
            :list="payloads.avaliable.dependents(pkg)"
            :max-depth="getDepth(payloads.avaliable.dependents(pkg).length, 2)"
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
        </div>

        <template v-if="payloads.avaliable.flatDependencies(pkg).length">
          <TreeDependencies
            py5 pt2 px4
            :currents="payloads.avaliable.dependencies(pkg)"
            :list="payloads.avaliable.flatDependencies(pkg)"
            :max-depth="getDepth(payloads.avaliable.flatDependencies(pkg).length)"
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

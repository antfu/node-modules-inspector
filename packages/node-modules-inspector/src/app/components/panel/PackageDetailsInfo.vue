<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Menu as VMenu } from 'floating-vue'
import { computed, nextTick } from 'vue'
import { useRouter } from '#app/composables/router'
import { getBackend } from '../../backends'
import { selectedNode } from '../../state/current'
import { filters } from '../../state/filters'
import { getDeprecatedInfo, getNpmMeta, getNpmMetaLatest, getPublishTime, payloads } from '../../state/payload'
import { settings } from '../../state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const backend = getBackend()
const router = useRouter()

const meta = computed(() => getNpmMeta(props.pkg))
const latestMeta = computed(() => getNpmMetaLatest(props.pkg))
const deprecation = computed(() => getDeprecatedInfo(props.pkg))
const resolved = computed(() => props.pkg.resolved)
const homepage = computed(() => resolved.value.packageJson.homepage)
const engines = computed(() => resolved.value.packageJson.engines)

const duplicated = computed(() => {
  const value = payloads.filtered.versions.get(props.pkg.name)
  if (value && value?.length > 1)
    return value
  return undefined
})

function showDuplicatedGraph(pkgs: PackageNode[]) {
  filters.state.focus = null
  filters.state.why = pkgs.map(pkg => pkg.spec)
  selectedNode.value = pkgs[0]
  nextTick(() => {
    router.push({ path: '/graph', hash: location.hash })
  })
}
</script>

<template>
  <div flex="~ col gap-2">
    <div flex gap2 items-center>
      <DisplayPackageName
        :name="pkg.name"
        :provenance="meta?.provenance"
        font-mono text-2xl flex="~ wrap items-center gap-2"
        :class="deprecation?.latest ? deprecation.type === 'future' ? 'text-orange line-through' : 'text-red line-through' : ''"
      />

      <DisplayProvenanceBadge :pkg />
    </div>

    <div v-if="pkg.resolved?.packageJson?.description" text-sm op-fade line-clamp-3 text-ellipsis mt--1 mb1>
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
          v-tooltip="settings.preferNpmx ? 'Open on npmx.dev' : 'Open on npmjs.com'"
          :to="settings.preferNpmx ? `https://npmx.dev/${pkg.name}@${pkg.version}` : `https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`"
          :title="settings.preferNpmx ? 'Open on npmx.dev' : 'Open on npmjs.com'"
          target="_blank"
          external
          w-8 h-8 rounded-full hover:bg-active flex
        >
          <div i-catppuccin-npm icon-catppuccin ma />
        </NuxtLink>
        <NuxtLink
          v-if="resolved.repository"
          v-tooltip="'Open Repository'"
          :to="resolved.repository.url"
          title="Open Repository"
          target="_blank"
          external
          ml--1 w-8 h-8 rounded-full hover:bg-active flex
        >
          <div i-catppuccin-git icon-catppuccin ma />
        </NuxtLink>
        <NuxtLink
          v-if="homepage"
          v-tooltip="'Open Homepage'"
          :to="homepage"
          title="Open Homepage"
          target="_blank"
          external
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
    <div v-if="resolved.license || resolved.authors?.length || engines?.node || getPublishTime(pkg)" flex="~ gap-2 wrap items-center">
      <span v-if="resolved.license">{{ resolved.license }}</span>
      <template v-if="resolved.authors?.length">
        <span v-if="resolved.license" op-fade>·</span>
        <DisplayAuthors :authors="resolved.authors" :size="22" />
      </template>
      <template v-if="engines?.node">
        <span op-fade>·</span>
        <DisplayNodeVersionRange :range="engines?.node" />
      </template>
      <template v-if="getPublishTime(pkg)">
        <span op-fade>·</span>
        <DisplayDateBadge :pkg rounded-full text-sm />
      </template>
    </div>
  </div>
</template>

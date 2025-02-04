<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { DisplayNumberBadge } from '#components'
import { Menu as VMenu } from 'floating-vue'
import { computed } from 'vue'
import { getBackend } from '~/backends'
import { filters } from '~/state/filters'
import { payload } from '~/state/payload'
import { query } from '~/state/query'
import { settings } from '~/state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const backend = getBackend()

const duplicated = computed(() => {
  const value = payload.filtered.versions.get(props.pkg.name)
  if (value && value?.length > 1)
    return value
  return undefined
})

const status = computed(() => {
  return {
    isExcluded: payload.excluded.packages.has(props.pkg),
    isUnFocused: filters.focus ? !payload.filtered.packages.includes(props.pkg) : false,
    isFocused: filters.focus ? payload.filtered.packages.includes(props.pkg) : false,
  }
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

function toggleFocus() {
  let current = filters.focus || []
  if (current.includes(props.pkg.spec))
    current = current.filter(x => x !== props.pkg.spec)
  else
    current = [...current, props.pkg.spec]
  filters.focus = current.length === 0 ? null : current
}

function toggleExclude() {
  let current = filters.excludes || []
  if (current.includes(props.pkg.spec))
    current = current.filter(x => x !== props.pkg.spec)
  else
    current = [...current, props.pkg.spec]
  filters.excludes = current.length === 0 ? null : current
}
</script>

<template>
  <div v-if="pkg" of-hidden h-full flex="~ col gap-0">
    <div absolute top-2 right-2 flex="~ items-center gap-0">
      <VMenu placement="bottom-start" :triggers="['click', 'touch']">
        <button
          w-10 h-10 rounded-full
          op30
          hover="op100 bg-active"
          flex="~ items-center justify-center"
        >
          <div i-ph-dots-three-vertical-bold />
        </button>
        <template #popper>
          <div p1 flex="~ col">
            <button
              px2 py1 rounded hover:bg-active flex="~ items-center gap-2"
              :class="filters.focus?.includes(pkg.spec) ? 'text-primary' : 'op75'"
              :disabled="filters.excludes?.includes(pkg.spec)"
              class="disabled:op25! disabled:pointer-events-none"
              @click="toggleFocus()"
            >
              <div i-ph-arrows-in-cardinal-duotone flex-none />
              <span class="ml-2">{{ filters.focus?.includes(pkg.spec) ? 'Unfocus' : 'Focus' }} on this package</span>
            </button>
            <button
              px2 py1 rounded hover:bg-active flex="~ items-center gap-2"
              :class="filters.excludes?.includes(pkg.spec) ? 'text-purple' : 'op75'"
              @click="toggleExclude()"
            >
              <div i-ph-network-slash-duotone flex-none />
              <span class="ml-2">{{ filters.excludes?.includes(pkg.spec) ? 'Un-exclude' : 'Exclude' }} this package</span>
            </button>
          </div>
        </template>
      </VMenu>
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

    <div flex="~ col gap-2" p5>
      <div font-mono text-2xl flex="~ wrap items-center gap-2" pr20>
        <span>{{ pkg.name }}</span>
        <DisplayModuleType text-sm :pkg :force="true" />
      </div>
      <div flex="~ items-center wrap gap-2">
        <DisplayVersion :version="pkg.version" op75 />
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
                @click="query.selected = versionNode.spec"
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
          <button
            v-if="backend.functions.openInEditor"
            title="Open Package Folder in Editor"
            ml--1 w-8 h-8 rounded-full hover:bg-active flex
            @click="backend.functions.openInEditor(pkg.filepath)"
          >
            <div i-catppuccin-folder-vscode hover:i-catppuccin-folder-vscode-open icon-catppuccin ma />
          </button>
          <button
            v-if="backend.functions.openInFinder"
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
      </div>
      <div flex="~ gap-2 wrap items-center">
        <div v-if="pkg.private" badge-color-gray px2 rounded text-sm border="~ base dashed">
          Private
        </div>
        <div v-if="pkg.workspace" badge-color-lime px2 rounded text-sm>
          Workspace
        </div>
        <div v-if="status.isExcluded" badge-color-purple px2 rounded text-sm>
          Excluded
        </div>
        <div v-if="status.isUnFocused" badge-color-yellow px2 rounded text-sm>
          Not in Focus
        </div>
        <div v-if="status.isFocused" badge-color-green px2 rounded text-sm>
          In Focus
        </div>
      </div>
    </div>

    <div flex="~" select-none h-10>
      <div border="b base" w-2 />
      <button
        flex-1 border border-base rounded-t-lg p1 flex="~ items-center justify-center gap-1" transition-margin
        :class="settings.packageDetailsTab === 'dependents' ? 'text-primary border-b-transparent' : 'saturate-0 hover:bg-active mt-5px'"
        @click="settings.packageDetailsTab = 'dependents'"
      >
        <span :class="settings.packageDetailsTab === 'dependents' ? '' : 'op30'">Used by</span>
        <DisplayNumberBadge
          text-xs rounded-full
          :number="settings.deepDependenciesTree ? pkg.flatDependents.size : pkg.dependents.size"
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
          :number="settings.deepDependenciesTree ? pkg.flatDependencies.size : pkg.dependencies.size"
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
          <PackageDependentTree
            py5 px4
            :currents="Array.from(pkg.flatDependents).map(payload.avaliable.get).filter(x => !!x).filter(i => i?.workspace)"
            :list="Array.from(pkg.flatDependents).map(payload.avaliable.get).filter(x => !!x)"
            :max-depth="getDepth(pkg.flatDependents.size, 2)"
            type="dependents"
          />
        </template>
        <div v-else op25 italic text-center py3>
          No dependents
        </div>
      </template>
      <template v-else-if="settings.packageDetailsTab === 'dependencies'">
        <ModuleTypePercentage
          p2 pt3
          :pkg="pkg"
          :flat="settings.deepDependenciesTree"
        />
        <template v-if="pkg.flatDependencies.size">
          <PackageDependentTree
            py5 pt2 px4
            :currents="Array.from(pkg.dependencies).map(payload.avaliable.get).filter(x => !!x)"
            :list="Array.from(pkg.flatDependencies).map(payload.avaliable.get).filter(x => !!x)"
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

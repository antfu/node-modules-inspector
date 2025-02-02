<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Menu as VMenu } from 'floating-vue'
import { computed } from 'vue'
import { getPackageFromSpec, packageVersionsMap } from '~/state/data'
import { query } from '~/state/query'
import { settings } from '~/state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const duplicated = computed(() => {
  const value = packageVersionsMap.get(props.pkg.name)
  if (value && value?.length > 1)
    return value
  return undefined
})
</script>

<template>
  <div v-if="pkg" of-hidden h-full flex="~ col gap-0">
    <button
      absolute top-2 right-2
      w-10 h-10 rounded-full
      op30
      hover="op100 bg-active"
      flex="~ items-center justify-center"
      @click="query.selected = undefined"
    >
      <div i-ph-x />
    </button>

    <div flex="~ col gap-2" p5>
      <div font-mono text-2xl flex="~ wrap items-center gap-2" pr6>
        <span>{{ pkg.name }}</span>
        <ModuleTypeLabel text-sm :pkg />
      </div>
      <div flex="~ items-center gap-2">
        <div font-mono op75>
          v{{ pkg.version }}
        </div>
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
                <span op75 flex-auto text-left>v{{ versionNode.version }}</span>
                <ModuleTypeLabel :pkg="versionNode" :badge="false" text-xs />
              </button>
            </div>
          </template>
        </VMenu>
        <div flex="~ gap-0 items-center">
          <NuxtLink
            :to="`https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`"
            title="Open on NPM"
            target="_blank"
            w-8 h-8 rounded-full hover:bg-hover flex
          >
            <div i-catppuccin-npm icon-catppuccin ma />
          </NuxtLink>
          <button
            title="Open package folder in editor"
            w-8 h-8 rounded-full hover:bg-hover flex
            @click="rpc.openInEditor(pkg.path)"
          >
            <div i-catppuccin-folder-vscode-open icon-catppuccin ma />
          </button>
          <button
            title="Open package folder in finder"
            w-8 h-8 rounded-full hover:bg-hover flex
            @click="rpc.openInFinder(pkg.path)"
          >
            <div i-catppuccin-folder-command-open icon-catppuccin ma />
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
    </div>

    <div flex="~">
      <div border="b base" w-2 />
      <button
        flex-1 border border-base rounded-t-lg p1 flex="~ items-center justify-center gap-1" transition-margin
        :class="settings.packageDetailsTab === 'dependents' ? 'text-primary border-b-transparent' : 'saturate-0 hover:bg-active mt-5px'"
        @click="settings.packageDetailsTab = 'dependents'"
      >
        <span :class="settings.packageDetailsTab === 'dependents' ? '' : 'op30'">Used by</span>
        <span bg-primary:10 rounded px1 text-sm text-primary>{{ settings.deepDependenciesTree ? pkg.flatDependents.size : pkg.dependents.size }}</span>
      </button>
      <div border="b base" w-2 />
      <button
        flex-1 border border-base rounded-t-lg p1 flex="~ items-center justify-center gap-1" transition-margin
        :class="settings.packageDetailsTab === 'dependencies' ? 'text-primary border-b-transparent' : 'saturate-0 hover:bg-active mt-5px'"
        @click="settings.packageDetailsTab = 'dependencies'"
      >
        <span :class="settings.packageDetailsTab === 'dependencies' ? '' : 'op30'">Deps on</span>
        <span bg-primary:10 rounded px1 text-sm text-primary>{{ settings.deepDependenciesTree ? pkg.flatDependencies.size : pkg.dependencies.size }}</span>
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

    <div flex="~ col gap-1" py5 px4 flex-auto of-auto>
      <template v-if="settings.packageDetailsTab === 'dependents'">
        <PackageDependentTree
          v-if="pkg.flatDependents.size"
          :currents="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x).filter(i => i?.nestedLevels.has(1))"
          :list="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x)"
          :max-depth="settings.deepDependenciesTree ? 10 : 1"
          type="dependents"
        />
        <div v-else op25 italic pl2>
          No dependents
        </div>
      </template>
      <template v-else-if="settings.packageDetailsTab === 'dependencies'">
        <PackageDependentTree
          v-if="pkg.flatDependencies.size"
          :currents="Array.from(pkg.dependencies).map(getPackageFromSpec).filter(x => !!x)"
          :list="Array.from(pkg.flatDependencies).map(getPackageFromSpec).filter(x => !!x)"
          :max-depth="settings.deepDependenciesTree ? 10 : 1"
          type="dependencies"
        />
        <div v-else op25 italic pl2>
          No dependencies
        </div>
      </template>
    </div>
  </div>
</template>

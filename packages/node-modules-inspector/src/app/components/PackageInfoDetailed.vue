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
  <div v-if="pkg" of-y-auto>
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
            <div>
              <div v-for="versionNode of duplicated" :key="versionNode.version" flex="~ items-center gap-1">
                <button
                  py1 px2 rounded flex="~ items-center gap-1"
                  font-mono hover="bg-active"
                  @click="query.selected = versionNode.spec"
                >
                  <span op75>v{{ versionNode.version }}</span>
                  <ModuleTypeLabel :pkg="versionNode" />
                </button>
              </div>
            </div>
          </template>
        </VMenu>
      </div>
      <div flex="~ gap-2 wrap items-center">
        <span>{{ pkg.resolved.license }}</span>
        <span op50>·</span>
        <template v-if="pkg.resolved.author">
          <span>
            {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
          </span>
          <span op50>·</span>
        </template>
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
    </div>

    <div flex="~ col gap-1">
      <SubTitle px1 select-none @click="settings.deepDependentsTree = !settings.deepDependentsTree">
        <button
          w-5 h-5 rounded hover:bg-active flex="~ items-center justify-center"
          :class="pkg.flatDependents.size !== pkg.dependents.size ? '' : 'op0'"
        >
          <div i-ph-caret-down transition :class="settings.deepDependentsTree ? '' : 'rotate--90'" />
        </button>
        Used by
        <span font-mono text-sm>
          ({{ settings.deepDependentsTree ? pkg.flatDependents.size : pkg.dependents.size }})
        </span>
      </SubTitle>
      <PackageDependentTree
        v-if="pkg.flatDependents.size"
        px4 of-auto
        :currents="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x).filter(i => i?.nestedLevels.has(1))"
        :list="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x)"
        :max-depth="settings.deepDependentsTree ? 10 : 1"
        type="dependents"
      />
      <div v-else op25 italic pl7>
        No dependents
      </div>
    </div>

    <div mb5 flex="~ col gap-1">
      <SubTitle px1 select-none @click="settings.deepDependenciesTree = !settings.deepDependenciesTree">
        <button
          w-5 h-5 rounded hover:bg-active flex="~ items-center justify-center"
          :class="pkg.flatDependencies.size === pkg.dependencies.size ? 'op0' : ''"
        >
          <div i-ph-caret-down transition :class="settings.deepDependenciesTree ? '' : 'rotate--90'" />
        </button>
        Dependencies
        <span font-mono text-sm>
          ({{ settings.deepDependenciesTree ? pkg.flatDependencies.size : pkg.dependencies.size }})
        </span>
      </SubTitle>
      <PackageDependentTree
        v-if="pkg.flatDependencies.size"
        px4 of-auto
        :currents="Array.from(pkg.dependencies).map(getPackageFromSpec).filter(x => !!x)"
        :list="Array.from(pkg.flatDependencies).map(getPackageFromSpec).filter(x => !!x)"
        :max-depth="settings.deepDependenciesTree ? 10 : 1"
        type="dependencies"
      />
      <div v-else op25 italic pl7>
        No dependencies
      </div>
    </div>
  </div>
</template>

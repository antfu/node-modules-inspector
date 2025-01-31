<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { Menu as VMenu } from 'floating-vue'
import { computed } from 'vue'
import { getPackageFromSpec, packageVersionsMap } from '~/state/data'
import { query } from '~/state/query'

const props = defineProps<{
  pkg: ResolvedPackageNode
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
    <div flex="~ col gap-2">
      <div font-mono text-2xl flex="~ items-center gap-2">
        <span>{{ pkg.name }}</span>
        <ModuleTypeLabel text-sm :type="pkg.resolved.module" />
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
              <div v-for="pkg of duplicated" :key="pkg.version" flex="~ items-center gap-1">
                <button
                  py1 px2 rounded flex="~ items-center gap-1"
                  font-mono hover="bg-active"
                  @click="query.selected = pkg.spec"
                >
                  <span op75>v{{ pkg.version }}</span>
                  <ModuleTypeLabel :type="pkg.resolved.module" />
                </button>
              </div>
            </div>
          </template>
        </VMenu>
      </div>
      <div>
        {{ pkg.resolved.license }}
      </div>
      <div>
        {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
      </div>
    </div>

    <div v-if="pkg.flatDependents.size" mt5 flex="~ col gap-1">
      <SubTitle>
        Used by ({{ pkg.dependents.size }} / {{ pkg.flatDependents.size }})
      </SubTitle>
      <PackageDependentTree
        of-auto
        :currents="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x).filter(i => i?.nestedLevels.has(1))"
        :list="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x)"
        type="dependents"
      />
    </div>

    <div mt5 flex="~ col gap-1">
      <SubTitle>
        Dependencies ({{ pkg.dependencies.size }} / {{ pkg.flatDependencies.size }})
      </SubTitle>
      <PackageDependentTree
        v-if="pkg.flatDependencies.size"
        of-auto
        :currents="Array.from(pkg.dependencies).map(getPackageFromSpec).filter(x => !!x)"
        :list="Array.from(pkg.flatDependencies).map(getPackageFromSpec).filter(x => !!x)"
        type="dependencies"
      />
      <div v-else op25 italic>
        No dependencies
      </div>
    </div>
  </div>
</template>

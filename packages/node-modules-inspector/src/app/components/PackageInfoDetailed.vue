<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { getPackageFromSpec } from '~/state/data'

defineProps<{
  pkg: ResolvedPackageNode
}>()
</script>

<template>
  <div v-if="pkg" of-y-auto>
    <div font-mono text-xl>
      {{ pkg.name }}
    </div>
    <div flex="~ items-center gap-2">
      <div font-mono>
        v{{ pkg.version }}
      </div>
      <ModuleTypeLabel text-sm :type="pkg.resolved.module" />
    </div>
    <div>
      {{ pkg.resolved.license }}
    </div>
    <div>
      {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
    </div>

    <div v-if="pkg.flatDependents.size" mt5 flex="~ col gap-1">
      <div op50>
        Used by ({{ pkg.dependents.size }} / {{ pkg.flatDependents.size }})
      </div>
      <PackageDependentTree
        of-auto
        :currents="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x).filter(i => i?.nestedLevels.has(1))"
        :list="Array.from(pkg.flatDependents).map(getPackageFromSpec).filter(x => !!x)"
        type="dependents"
      />
    </div>

    <div v-if="pkg.flatDependencies.size" mt5 flex="~ col gap-1">
      <div op50>
        Dependencies ({{ pkg.dependencies.size }} / {{ pkg.flatDependencies.size }})
      </div>
      <PackageDependentTree
        of-auto
        :currents="Array.from(pkg.dependencies).map(getPackageFromSpec).filter(x => !!x)"
        :list="Array.from(pkg.flatDependencies).map(getPackageFromSpec).filter(x => !!x)"
        type="dependencies"
      />
      <!-- <div flex="~ col gap-1" of-auto>
        <template v-for="spec of pkg.flatDependencies" :key="spec">
          <PackageInfoList :pkg="getPackageFromSpec(spec)" />
        </template>
      </div> -->
    </div>
  </div>
</template>

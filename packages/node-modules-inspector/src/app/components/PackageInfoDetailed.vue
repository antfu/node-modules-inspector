<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { getPackageFromSpec } from '~/state/data'
import PackageInfoList from './PackageInfoList.vue'

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
        Depended by ({{ pkg.flatDependents.size }})
      </div>
      <div flex="~ col gap-1" of-auto>
        <template v-for="spec of pkg.flatDependents" :key="spec">
          <PackageInfoList :pkg="getPackageFromSpec(spec)" />
        </template>
      </div>
    </div>

    <div v-if="pkg.flatDependencies.size" mt5 flex="~ col gap-1">
      <div op50>
        Dependencies ({{ pkg.flatDependencies.size }})
      </div>
      <div flex="~ col gap-1" of-auto>
        <template v-for="spec of pkg.flatDependencies" :key="spec">
          <PackageInfoList :pkg="getPackageFromSpec(spec)" />
        </template>
      </div>
    </div>
  </div>
</template>

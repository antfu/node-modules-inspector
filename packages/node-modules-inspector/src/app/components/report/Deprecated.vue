<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { DeprecationType } from '~/state/payload'
import { useRouter } from '#app/composables/router'
import { DisplayDateBadge } from '#components'
import { computed, nextTick } from 'vue'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'
import { getDeprecatedInfo, payloads } from '~/state/payload'

const router = useRouter()

const groups = computed(() => {
  const all: PackageNode[] = []
  const types: Record<DeprecationType, PackageNode[]> = {
    package: [],
    current: [],
    future: [],
  }

  payloads.filtered.packages.forEach((pkg) => {
    const deprecation = getDeprecatedInfo(pkg)
    if (!deprecation)
      return
    all.push(pkg)
    types[deprecation.type].push(pkg)
  })

  return {
    all,
    types,
  }
})

function showGraph(pkg: PackageNode) {
  filters.state.focus = null
  filters.state.why = [pkg.spec]
  selectedNode.value = pkg
  nextTick(() => {
    router.push({ path: '/graph', hash: location.hash })
  })
}

const titleMap = {
  package: 'Deprecated Packages',
  current: 'Current Versions Deprecated',
  future: 'Future Deprecations',
}

function getDeprecationMessage(pkg: PackageNode): string {
  const deprecation = getDeprecatedInfo(pkg)!
  return deprecation.current ?? deprecation.latest ?? 'Deprecated'
}
</script>

<template>
  <template v-if="groups.all.length">
    <div badge-color-red flex="~ gap-2 items-center" rounded-lg p2 my2 px3>
      <div i-ph-warning-duotone flex-none />
      <span>Let's work together to improve the ecosystem by updating or replacing these deprecated packages</span>
    </div>

    <template v-for="[key, pkgs] of Object.entries(groups.types)" :key="key">
      <template v-if="key !== 'any' && pkgs.length">
        <UiSubTitle>
          <span>{{ titleMap[key as keyof typeof titleMap] }}</span>
          <DisplayNumberBadge :number="pkgs.length" rounded-full text-sm color="badge-color-red" />
        </UiSubTitle>
        <div grid="~ cols-minmax-250px gap-4">
          <div
            v-for="pkg of pkgs" :key="pkg.spec"
            border="~ base rounded-lg" bg-glass
            flex="~ col"
            cursor-pointer
            :class="selectedNode === pkg ? 'border-primary ring-4 ring-primary:20' : ''"
            @click="selectedNode = pkg"
          >
            <div flex="~ items-center gap-2" border="b base" px2 py1>
              <h2 font-mono flex-auto pl2>
                <DisplayPackageSpec :pkg="pkg" />
              </h2>
              <button
                p1 rounded-full op50 hover:bg-active hover:text-primary hover:op100 flex="~ items-center"
                title="Show Graph"
                @click="showGraph(pkg)"
              >
                <div i-ph-graph-duotone text-lg />
              </button>
            </div>
            <div flex="~ col gap-3" p3 h-full>
              <div text-red9 dark:text-red2 text-sm px1>
                {{ getDeprecationMessage(pkg) }}
              </div>
              <div flex="~ justify-between items-end w-full" mt-auto>
                <DisplayDateBadge :pkg rounded-full text-xs />
                <DisplayModuleType :pkg text-xs />
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </template>
  <template v-else>
    <UiSubTitle>
      No Deprecated Packages
    </UiSubTitle>
    <div badge-color-green flex="~ gap-2 items-center" rounded-lg p2 my2 px3>
      <div i-ph-check-circle-duotone flex-none />
      <span>Great! None of your packages are deprecated</span>
    </div>
  </template>
</template>

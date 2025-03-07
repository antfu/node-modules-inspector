<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { useRouter } from '#app/composables/router'
import { DisplayDateBadge } from '#components'
import { computed, nextTick } from 'vue'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'
import { payloads } from '~/state/payload'
import { settings } from '~/state/settings'

const router = useRouter()

const deprecatedPackages = computed(() => {
  return payloads.filtered.packages.filter(pkg =>
    pkg.resolved.deprecatedInfo?.current?.deprecated
    || pkg.resolved.deprecatedInfo?.last?.deprecated,
  ).sort((a, b) => a.name.localeCompare(b.name))
})

const currentDeprecated = computed(() => {
  return deprecatedPackages.value.filter(pkg =>
    pkg.resolved.deprecatedInfo?.current?.deprecated
    && pkg.resolved.deprecatedInfo?.last?.deprecated,
  )
})

const currentDeprecatedButLatestOk = computed(() => {
  return deprecatedPackages.value.filter(pkg =>
    pkg.resolved.deprecatedInfo?.current?.deprecated
    && !pkg.resolved.deprecatedInfo?.last?.deprecated,
  )
})

const futureDeprecated = computed(() => {
  return deprecatedPackages.value.filter(pkg =>
    !pkg.resolved.deprecatedInfo?.current?.deprecated
    && pkg.resolved.deprecatedInfo?.last?.deprecated,
  )
})

function showGraph(pkg: PackageNode) {
  filters.state.focus = null
  filters.state.why = [pkg.spec]
  selectedNode.value = pkg
  nextTick(() => {
    router.push({ path: '/graph', hash: location.hash })
  })
}

function getDeprecationMessage(pkg: PackageNode, type: 'current' | 'last'): string {
  if (type === 'current') {
    return pkg.resolved.deprecatedInfo?.current?.deprecated ?? ''
  }
  else {
    return pkg.resolved.deprecatedInfo?.last?.deprecated ?? ''
  }
}
</script>

<template>
  <template v-if="deprecatedPackages.length">
    <UiSubTitle>
      Deprecated Packages
      <DisplayNumberBadge :number="deprecatedPackages.length" rounded-full text-sm color="badge-color-red" />
    </UiSubTitle>

    <div badge-color-red flex="~ gap-2 items-center" rounded-lg p2 my2 px3>
      <div i-ph-warning-duotone flex-none />
      <span>Let's work together to improve the ecosystem by updating or replacing these deprecated packages</span>
    </div>

    <template v-if="currentDeprecated.length">
      <h3 text-lg font-bold mt-4 mb-2>
        Currently Deprecated (Latest Also Deprecated)
      </h3>
      <div grid="~ cols-minmax-250px gap-4">
        <div
          v-for="pkg of currentDeprecated" :key="pkg.spec"
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
          <div flex="~ col gap-1" p2 h-full>
            <div class="text-gray-400 text-sm mb-2">
              {{ getDeprecationMessage(pkg, 'current') }}
            </div>
            <div flex="~ justify-between items-end w-full" mt-auto>
              <DisplayDateBadge v-if="settings.showPublishTimeBadge" :pkg :badge="false" rounded-full text-xs />
              <DisplayModuleType :pkg :badge="false" text-xs />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="currentDeprecatedButLatestOk.length">
      <h3 text-lg font-bold mt-4 mb-2>
        Currently Deprecated (Latest Version OK)
      </h3>
      <div grid="~ cols-minmax-250px gap-4">
        <div
          v-for="pkg of currentDeprecatedButLatestOk" :key="pkg.spec"
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
          <div flex="~ col gap-1" p2 h-full>
            <div class="text-gray-400 text-sm mb-2">
              {{ getDeprecationMessage(pkg, 'current') }}
            </div>
            <div flex="~ justify-between items-end w-full" mt-auto>
              <DisplayDateBadge v-if="settings.showPublishTimeBadge" :pkg :badge="false" rounded-full text-xs />
              <DisplayModuleType :pkg :badge="false" text-xs />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="futureDeprecated.length">
      <h3 text-lg font-bold mt-4 mb-2>
        Future Deprecated (Latest Version)
      </h3>
      <div grid="~ cols-minmax-250px gap-4">
        <div
          v-for="pkg of futureDeprecated" :key="pkg.spec"
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
          <div flex="~ col gap-1" p2 h-full>
            <div class="text-gray-400 text-sm mb-2">
              Latest version ({{ pkg.resolved.deprecatedInfo?.last?.version }}) is deprecated:
              {{ getDeprecationMessage(pkg, 'last') }}
            </div>
            <div flex="~ justify-between items-end w-full" mt-auto>
              <DisplayDateBadge v-if="settings.showPublishTimeBadge" :pkg :badge="false" rounded-full text-xs />
              <DisplayModuleType :pkg :badge="false" text-xs />
            </div>
          </div>
        </div>
      </div>
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

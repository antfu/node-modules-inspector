<script setup lang="ts">
import { filters } from '../../state/filters'
</script>

<template>
  <div flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center">
      <div
        v-tooltip="'Excluded packages and the dependencies they introduced are ignored in all representations'"
        flex="~ gap-2 items-center" select-none
      >
        <div i-ph-network-slash-duotone flex-none />
        <div>Excludes</div>
      </div>
      <div flex-auto />
      <button
        btn-action :disabled="filters.exclude.activated.length === 0"
        @click="filters.exclude.reset()"
      >
        <div i-ph-trash-simple-duotone />
        Reset
      </button>
    </div>
    <div v-if="filters.state.excludes" flex="~ gap-2 wrap">
      <div
        v-for="spec of filters.state.excludes"
        :key="spec"
        badge-color-purple rounded-full px2 pl3 py0.5
        flex="~ gap-1 items-center"
      >
        <div font-mono text-sm>
          {{ spec }}
        </div>
        <button op-fade hover:op100 @click="filters.excludes.toggle(spec, false)">
          <div i-ph-x op-fade />
        </button>
      </div>
    </div>
    <div v-else op-fade text-sm italic>
      To exclude a specific package, select from its menu
    </div>
    <div mt2 flex="~ col gap-1">
      <OptionItem title="Exclude Types Packages" description="Exclude TypeScript declaration packages">
        <OptionCheckbox v-model="filters.state.excludeDts" />
      </OptionItem>
      <OptionItem title="Exclude Private Packages" description="Exclude private workspace packages and their dependencies">
        <OptionCheckbox v-model="filters.state.excludePrivate" />
      </OptionItem>
      <OptionItem title="Exclude Workspace Roots" description="Exclude workspaces but NOT their dependencies">
        <OptionCheckbox v-model="filters.state.excludeWorkspace" />
      </OptionItem>
    </div>
  </div>
</template>

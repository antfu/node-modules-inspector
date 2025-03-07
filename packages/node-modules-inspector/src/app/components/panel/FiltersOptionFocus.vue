<script setup lang="ts">
import { filters } from '~/state/filters'
</script>

<template>
  <div v-if="filters.state.focus" flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center">
      <div i-ph-arrows-in-cardinal-duotone flex-none />
      <div>
        <div>Focus On</div>
        <div op50 text-sm mt--0.5>
          Filter specific packages and their dependencies
        </div>
      </div>
    </div>
    <div flex="~ gap-2 wrap">
      <div
        v-for="spec of filters.state.focus"
        :key="spec"
        badge-color-primary rounded-full px2 pl3 py0.5
        flex="~ gap-1 items-center"
      >
        <div font-mono text-sm>
          {{ spec }}
        </div>
        <button op50 hover:op100 @click="filters.focus.toggle(spec, false)">
          <div i-ph-x op50 />
        </button>
      </div>
    </div>
  </div>
</template>

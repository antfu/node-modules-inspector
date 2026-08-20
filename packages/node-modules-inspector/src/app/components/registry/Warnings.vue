<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { registryWarnings } from '../../registry'
import { rawPayload } from '../../state/data'

const dismissed = shallowRef(false)

const warnings = computed(() => {
  if (dismissed.value || !rawPayload.value)
    return []
  return registryWarnings.value
})
</script>

<template>
  <div
    v-if="warnings.length"
    fixed bottom-4 right-4 z-panel-nav max-w-100
    border="~ base rounded-lg" bg-glass shadow-lg
    flex="~ col gap-2" p4 text-sm
  >
    <div flex="~ gap-2 items-center">
      <div i-ph-warning-duotone text-amber flex-none />
      <span font-bold flex-auto>{{ warnings.length }} {{ warnings.length === 1 ? 'dependency was' : 'dependencies were' }} skipped</span>
      <button op50 hover:op100 flex="~ items-center" @click="dismissed = true">
        <div i-ph-x />
      </button>
    </div>
    <div flex="~ col gap-1" max-h-60 of-y-auto>
      <div v-for="(warning, idx) of warnings" :key="idx" flex="~ gap-2 items-center" font-mono text-xs>
        <span op75>{{ warning.name }}</span>
        <span badge-color-amber px1 rounded>{{ warning.spec }}</span>
        <span v-if="warning.dependent" op50>from {{ warning.dependent }}</span>
      </div>
    </div>
    <div op50 text-xs>
      These specs cannot be resolved from the npm registry. Use Sandbox Install mode for full fidelity.
    </div>
  </div>
</template>

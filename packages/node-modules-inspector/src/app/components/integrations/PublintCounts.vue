<script setup lang="ts">
import type { PublintMessage } from 'node-modules-tools'
import { computed } from 'vue'

const props = defineProps<{
  messages: readonly PublintMessage[] | undefined | null
}>()

const counter = computed(() => {
  const values = { error: 0, warning: 0, suggestion: 0 }
  for (const m of props.messages || [])
    values[m.type]++
  return values
})
</script>

<template>
  <template v-if="counter.error">
    <DisplayNumberBadge :number="counter.error" rounded-full text-sm color="badge-color-red">
      <template #after>
        <span text-xs ml1 op-fade>error{{ counter.error > 1 ? 's' : '' }}</span>
      </template>
    </DisplayNumberBadge>
  </template>
  <template v-if="counter.warning">
    <DisplayNumberBadge :number="counter.warning" rounded-full text-sm color="badge-color-amber">
      <template #after>
        <span text-xs ml1 op-fade>warning{{ counter.warning > 1 ? 's' : '' }}</span>
      </template>
    </DisplayNumberBadge>
  </template>
  <template v-if="counter.suggestion">
    <DisplayNumberBadge :number="counter.suggestion" rounded-full text-sm color="badge-color-blue">
      <template #after>
        <span text-xs ml1 op-fade>suggestion{{ counter.suggestion > 1 ? 's' : '' }}</span>
      </template>
    </DisplayNumberBadge>
  </template>
</template>

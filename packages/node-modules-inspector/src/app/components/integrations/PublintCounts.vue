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
  <DisplayNumberBadge v-if="counter.error" :value="counter.error" color="red" :suffix="counter.error > 1 ? 'errors' : 'error'" />
  <DisplayNumberBadge v-if="counter.warning" :value="counter.warning" color="amber" :suffix="counter.warning > 1 ? 'warnings' : 'warning'" />
  <DisplayNumberBadge v-if="counter.suggestion" :value="counter.suggestion" color="blue" :suffix="counter.suggestion > 1 ? 'suggestions' : 'suggestion'" />
</template>

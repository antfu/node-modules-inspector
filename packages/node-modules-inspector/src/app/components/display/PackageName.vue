<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  pkg?: PackageNode
}>()

const isFutureDeprecated = computed(() => props.pkg?.resolved?.deprecatedInfo?.last?.deprecated || false)

const deprecationTitle = computed(() => {
  if (isFutureDeprecated.value) {
    const lastInfo = props.pkg?.resolved?.deprecatedInfo?.last
    if (lastInfo) {
      return `Will be deprecated in ${lastInfo.version}: ${lastInfo.message}`
    }
  }
  return ''
})
</script>

<template>
  <span
    font-mono
    :class="{ 'text-red-500': isFutureDeprecated }"
    :title="deprecationTitle"
  >
    {{ name }}
  </span>
</template>

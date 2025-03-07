<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'

const props = defineProps<{
  name: string
  pkg?: PackageNode
}>()

const isDeprecated = computed(() => props.pkg?.resolved?.deprecatedInfo?.deprecated || false)
const willBeDeprecated = computed(() => props.pkg?.resolved?.deprecatedInfo?.willbedeprecated)

const deprecationTitle = computed(() => {
  if (isDeprecated.value) {
    return 'This package is deprecated'
  }
  if (willBeDeprecated.value) {
    return `Will be deprecated in version ${willBeDeprecated.value.version} (${willBeDeprecated.value.versionsCount} versions ahead)`
  }
  return ''
})
</script>

<template>
  <span
    font-mono
    :class="{ 'text-red-500': isDeprecated }"
    :title="deprecationTitle"
  >
    {{ name }}
  </span>
</template>

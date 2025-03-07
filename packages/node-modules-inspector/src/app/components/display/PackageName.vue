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
    if (lastInfo?.deprecated) {
      return `${props.pkg?.name}@${lastInfo.version} (last version) is deprecated: ${lastInfo.deprecated}`
    }
  }
  return ''
})
</script>

<template>
  <span
    v-tooltip="deprecationTitle"
    font-mono
    :class="{ 'text-red-500 line-through': isFutureDeprecated }"
  >
    {{ name }}
  </span>
</template>

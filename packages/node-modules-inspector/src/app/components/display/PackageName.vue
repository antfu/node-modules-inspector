<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getDeprecatedInfo } from '~/state/payload'

const props = defineProps<{
  name: string
  pkg?: PackageNode
}>()

const deprecation = computed(() => getDeprecatedInfo(props.pkg || props.name))
const isFutureDeprecated = computed(() => deprecation.value?.latest)

const deprecationTitle = computed(() => {
  if (isFutureDeprecated.value) {
    return `${props.pkg?.name}@${deprecation.value?.latestVersion} (last version) is deprecated: ${isFutureDeprecated.value}`
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

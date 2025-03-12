<script setup lang="ts">
import type { ParsedFunding } from 'node-modules-tools/utils'
import SafeImage from './SafeImage.vue'

defineProps<{
  funding: ParsedFunding
}>()
</script>

<template>
  <a
    v-if="funding"
    v-tooltip="'Open Funding Page'"
    :href="funding.url"
    title="Open Funding Page"
    target="_blank"
    flex="~ gap-2" of-hidden text-ellipsis
  >
    <SafeImage
      v-if="funding.avatar" :src="funding.avatar"
      bg-active border="~ base rounded-full"
      w6 h6 crossorigin="anonymous"
    />
    <span>{{ funding.name }}</span>
    <slot />
  </a>
</template>

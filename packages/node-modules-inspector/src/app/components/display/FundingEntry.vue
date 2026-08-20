<script setup lang="ts">
import type { ParsedFunding } from 'node-modules-tools/utils'
import DisplayAvatar from '@antfu/design/components/Display/DisplayAvatar.vue'

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
    <DisplayAvatar
      v-if="funding.avatar"
      :src="funding.avatar"
      :name="funding.name"
      :size="24"
      class="bg-ambient border border-base"
    />
    <span>{{ funding.name }}</span>
    <slot />
  </a>
</template>

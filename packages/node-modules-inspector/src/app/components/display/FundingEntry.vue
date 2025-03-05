<script setup lang="ts">
import { computed } from 'vue'
import { parseFunding } from '../../utils/funding'
import SafeImage from './SafeImage.vue'

const props = defineProps<{
  funding?: string
}>()

const parsed = computed(() => parseFunding(props.funding))
</script>

<template>
  <a v-if="parsed" :href="parsed.url" target="_blank" flex="~ gap-2">
    <SafeImage
      v-if="parsed.avatar" :src="parsed.avatar"
      bg-active border="~ base rounded-full"
      w6 h6 crossorigin="anonymous"
    />
    <span>{{ parsed.name }}</span>
    <slot />
  </a>
</template>

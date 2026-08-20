<script setup lang="ts">
import type { ParsedAuthor } from 'node-modules-tools/utils'
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  author: ParsedAuthor
  link?: boolean
  size?: number
}>(), {
  link: true,
  size: 28,
})

const href = computed(() => {
  if (!props.link)
    return undefined
  if (props.author.type === 'github')
    return `https://github.com/${props.author.github}`
  return props.author.url
})

// Avatars are served cross-origin (e.g. avatars.antfu.dev). The hosted web
// build sets COEP `require-corp` (for WebContainer), which blocks cross-origin
// images unless they are requested in CORS mode — hence `crossorigin`. Fall
// back to an icon if the image fails.
const avatarErrored = ref(false)
watch(() => props.author, () => {
  avatarErrored.value = false
})
</script>

<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    :target="href ? '_blank' : undefined"
    flex="~ gap-1.5 items-center" of-hidden text-ellipsis
    :style="{ fontSize: `${props.size * 0.5}px`, height: `${props.size}px` }"
    :class="href ? 'hover:bg-hover' : ''"
    border="y r base rounded-full" pr-2
  >
    <template
      v-if="author.type === 'github'"
    >
      <img
        v-if="author.avatar && !avatarErrored"
        :src="author.avatar"
        :alt="author.github"
        crossorigin="anonymous"
        loading="lazy"
        class="rounded-full bg-ambient border border-base object-cover"
        :style="{ width: `${props.size}px`, height: `${props.size}px` }"
        @error="avatarErrored = true"
      >
      <div v-else i-ph-user-circle-duotone :style="{ width: `${props.size}px`, height: `${props.size}px` }" op-fade />
      <span font-mono>{{ author.github }}</span>
    </template>
    <template v-else>
      <div i-ph-user-circle-duotone :style="{ width: `${props.size}px`, height: `${props.size}px` }" op-fade scale-115 />
      <span>{{ author.name }}</span>
    </template>
    <slot name="after" />
  </component>
</template>

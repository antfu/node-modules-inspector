<script setup lang="ts">
import type { ParsedAuthor } from 'node-modules-tools/utils'
import { computed } from 'vue'
import SafeImage from './SafeImage.vue'

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
</script>

<template>
  <component
    :is="href ? 'a' : 'span'"
    :href="href"
    :target="href ? '_blank' : undefined"
    flex="~ gap-1.5 items-center" of-hidden text-ellipsis
    :style="{ fontSize: `${props.size * 0.5}px`, height: `${props.size}px` }"
    :class="href ? 'hover:bg-active' : ''"
    border="y r base rounded-full" pr-2
  >
    <template
      v-if="author.type === 'github'"
    >
      <SafeImage
        :src="author.avatar"
        bg-active border="~ base rounded-full"
        :style="{ width: `${props.size}px`, height: `${props.size}px` }"
        crossorigin="anonymous"
      >
        <template #fallback>
          <div i-ph-user-circle-duotone :style="{ width: `${props.size}px`, height: `${props.size}px` }" op-fade />
        </template>
      </SafeImage>
      <span font-mono>{{ author.github }}</span>
    </template>
    <template v-else>
      <div i-ph-user-circle-duotone :style="{ width: `${props.size}px`, height: `${props.size}px` }" op-fade scale-115 />
      <span>{{ author.name }}</span>
    </template>
    <slot name="after" />
  </component>
</template>

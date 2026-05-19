<script setup lang="ts">
import type { ParsedAuthor } from 'node-modules-tools/utils'

withDefaults(defineProps<{
  authors: ParsedAuthor[]
  separator?: string
  link?: boolean
  size?: number
}>(), {
  separator: '&',
  link: true,
})

function keyOf(author: ParsedAuthor) {
  return author.type === 'github' ? `@${author.github}` : author.name
}
</script>

<template>
  <span flex="~ gap-2 wrap items-center">
    <template
      v-for="(author, idx) of authors"
      :key="keyOf(author)"
    >
      <span v-if="idx > 0" text-xs op-fade>{{ separator }}</span>
      <DisplayAuthorEntry :author="author" :link="link" :size="size" />
    </template>
  </span>
</template>

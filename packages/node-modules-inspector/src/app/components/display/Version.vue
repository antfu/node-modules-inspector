<script setup lang="ts">
defineProps<{
  version?: string
  prefix?: string
  title?: string
}>()
</script>

<template>
  <span v-if="version" font-mono :title="title">{{ prefix || '' }}{{ version?.includes(':') ? version : `${prefix ? '' : 'v'}${version}` }}</span>
</template>

<script setup lang="ts">
defineProps<{
  version?: string
  prefix?: string
  title?: string
}>()
</script>

<template>
  <span v-if="version" v-tooltip="title" font-mono>{{ prefix || '' }}{{ version?.includes(':') ? version : `${prefix ? '' : 'v'}${version}` }}</span>
</template>

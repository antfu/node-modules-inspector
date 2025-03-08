<script setup lang="ts">
defineProps<{
  version?: string
  prefix?: string
}>()
</script>

<template>
  <span v-if="version" font-mono>{{ prefix || '' }}{{ version?.includes(':') ? version : `${prefix ? '' : 'v'}${version}` }}</span>
</template>

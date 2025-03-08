<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <span font-mono>{{ name }}</span>
</template>

<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <span font-mono break-all>{{ name }}<slot name="after" /></span>
</template>

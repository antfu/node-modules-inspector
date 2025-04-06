<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <UiSubTitle>
    {{ title }}
  </UiSubTitle>
  <div badge-color-green flex="~ gap-2 items-center" rounded-lg p2 my2 px3>
    <div i-ph-check-circle-duotone flex-none />
    <span>{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  message: string
  type?: 'checkmark' | 'info'
  color?: 'gray' | 'green'
}>(), {
  type: 'info',
  color: 'gray',
})
</script>

<template>
  <UiSubTitle>
    {{ title }}
  </UiSubTitle>
  <div
    :class="color === 'gray' ? 'badge-color-gray' : 'badge-color-green'"
    op75 flex="~ gap-2 items-center" rounded-lg p2 my2 px3
  >
    <div v-if="type === 'checkmark'" i-ph-check-circle-duotone flex-none />
    <div v-if="type === 'info'" i-ph-info-duotone flex-none />
    <span>{{ message }}</span>
  </div>
</template>

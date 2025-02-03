<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    number: number | string
    color?: string
  }>(),
  {
    color: 'badge-color-gray op75',
  },
)

const formatted = computed(() => {
  return Number(props.number).toLocaleString()
})
</script>

<template>
  <div :class="color" class="px-0.4em py-0.2em font-mono line-height-none">
    {{ formatted }}
  </div>
</template>

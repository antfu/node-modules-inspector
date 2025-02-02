<script setup lang="ts">
const value = defineModel<boolean>('modelValue', {
  type: Boolean,
})
</script>

<template>
  <div
    border="~ base rounded" flex="~ gap-2 items-center"
    relative h-5 w-5 hover:bg-active p0.5
    :class="value ? 'bg-primary:5' : 'bg-secondary'"
  >
    <div i-ph-check-bold text-xl text-primary :class="value ? '' : 'op0'" />
    <input v-model="value" type="checkbox" absolute inset-0 z-10 opacity-0.1>
  </div>
</template>

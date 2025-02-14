<script setup lang="ts">
const isLoading = ref(false)

useRuntimeHook('page:loading:start', () => { isLoading.value = true })
useRuntimeHook('page:loading:end', () => { isLoading.value = false })
</script>

<template>
  <div
    v-if="isLoading"
    flex="~ items-center justify-center" h-full page-padding bg-glass:50
    absolute left-0 top-0 w-full z-49
    animate-fade-in animate-delay-200 animate-fill-both animate-duration-0
  >
    <UiLogo
      w-30 h-30 transition-all duration-300
      animate="~ spin reverse"
    />
  </div>
  <div
    :class="{
      'page-padding': !$route.meta.noOffset,
    }"
  >
    <slot />
  </div>
</template>

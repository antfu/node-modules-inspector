<script setup lang="ts">
import { useRuntimeHook } from '#app/composables/runtime-hook'
import { ref } from 'vue'
import { settings } from '../state/settings'

const isLoading = ref(false)

useRuntimeHook('page:loading:start', () => {
  isLoading.value = true
})
useRuntimeHook('page:loading:end', () => {
  isLoading.value = false
})
useRuntimeHook('page:finish', () => {
  isLoading.value = false
})
</script>

<template>
  <div
    v-if="isLoading"
    flex="~ items-center justify-center" h-full bg-glass:50
    absolute left-0 top-0 w-full z-49
    animate-fade-in animate-delay-200 animate-fill-both animate-duration-0
    :class="settings.collapseSidepanel ? 'page-padding-collapsed' : 'page-padding'"
  >
    <UiLogo
      w-30 h-30 transition-all duration-300
      animate="~ spin reverse"
    />
  </div>
  <div
    transition-all duration-300
    :class="$route.meta.noOffset ? 'transition-none!' : settings.collapseSidepanel ? 'page-padding-collapsed' : 'page-padding'"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { toggleDark } from '~/composables/dark'
</script>

<template>
  <div
    fixed right-4 top-4 z-panel-nav flex="~ gap-4 items-center"
    bg-glass rounded-full border border-base shadow
  >
    <button
      w-10 h-10 rounded-full hover:bg-active op50 hover:op100
      flex="~ items-center justify-center"
      title="Settings"
      @click="toggleDark()"
    >
      <div i-ph-sun-duotone dark:i-ph-moon-duotone text-xl />
    </button>
  </div>
</template>

<script setup lang="ts">
import { toggleDark } from '~/composables/dark'
</script>

<template>
  <div
    fixed right-4 top-4 z-panel-nav flex="~ items-center"
    bg-glass rounded-full border border-base shadow
  >
    <a
      w-10 h-10 rounded-full hover:bg-active op50 hover:op100
      flex="~ items-center justify-center"
      href="https://github.com/antfu/node-modules-inspector" target="_blank"
    >
      <div i-ri-github-fill text-xl />
    </a>
    <button
      w-10 h-10 rounded-full hover:bg-active op50 hover:op100
      flex="~ items-center justify-center"
      title="Toggle Dark Mode"
      @click="toggleDark()"
    >
      <div i-ph-sun-duotone dark:i-ph-moon-duotone text-xl />
    </button>
  </div>
</template>

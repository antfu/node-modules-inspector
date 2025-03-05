<script setup lang="ts">
import { version } from '../../../../package.json'

defineProps<{
  isLoading?: boolean
  hasError?: boolean
}>()
</script>

<template>
  <h1 p5 flex="~ col gap-3 items-center">
    <div relative>
      <UiLogo
        w-30 h-30 transition-all duration-300
        :class="hasError ? 'hue-rotate--105' : isLoading ? 'animate-spin-reverse' : ''"
      />
      <div absolute top-0 right--2 text-orange transition-all duration-300 :class="hasError ? 'op100' : 'op0'">
        <div i-ph-warning-fill text-3xl />
      </div>
    </div>
    <div flex="~ gap-1" leading-none text-4xl mt-5>
      <span font-700 text-primary transition-all duration-300 :class="hasError ? 'hue-rotate--105' : ''">Node Modules</span>
      <span op75>Inspector</span>
      <span font-mono text-sm flex="~ col items-center" mr--14>
        <span op50>v{{ version }}</span>
      </span>
    </div>
    <div op50 text-center>
      Visualize your node_modules, inspect dependencies, and more.
    </div>
  </h1>
</template>

<script setup lang="ts">
import { toggleDark } from '../../composables/dark'
import { rawPayload } from '../../state/data'

const isWebContainer = import.meta.env.BACKEND === 'webcontainer'

function newInspect() {
  // eslint-disable-next-line no-alert
  if (confirm('To start a new inspect, the current state will be lost. Continue?')) {
    location.href = '/'
  }
}
</script>

<template>
  <div flex="~ items-center gap-2" fixed right-4 top-4 z-panel-nav>
    <PanelFiltersMini />
    <div
      flex="~ items-center"
      bg-glass rounded-full border border-base shadow
    >
      <button
        v-if="isWebContainer && rawPayload"
        v-tooltip="'Start a new inspect'"
        title="Start a new inspect"
        w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
        flex="~ items-center justify-center"
        @click="newInspect()"
      >
        <div i-ph-plus-circle-duotone text-xl />
      </button>
      <a
        v-tooltip="'Check source code on GitHub'"
        title="Check source code on GitHub"
        w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
        flex="~ items-center justify-center"
        href="https://github.com/antfu/node-modules-inspector" target="_blank"
      >
        <div i-ri-github-fill text-xl />
      </a>
      <button
        v-tooltip="'Toggle Dark Mode'"
        w-10 h-10 rounded-full hover:bg-active op-fade hover:op100
        flex="~ items-center justify-center"
        title="Toggle Dark Mode"
        @click="toggleDark()"
      >
        <div i-ph-sun-duotone dark:i-ph-moon-duotone text-xl />
      </button>
    </div>
  </div>
</template>

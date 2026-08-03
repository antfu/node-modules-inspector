<script setup lang="ts">
import { isDark, toggleDark } from '../../composables/dark'
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
      <ActionIconButton
        v-if="isWebContainer && rawPayload"
        tooltip="Start a new inspect"
        icon="i-ph-plus-circle-duotone"
        class="text-xl"
        @click="newInspect()"
      />
      <ActionIconButton
        tooltip="Check source code on GitHub"
        icon="i-ri-github-fill"
        class="text-xl"
        href="https://github.com/antfu/node-modules-inspector" target="_blank"
      />
      <!-- The design package owns no dark-mode state or toggle component
           (see its recipes.md); compose ActionIconButton with our own
           isDark/toggleDark (@vueuse/core's useDark) instead. -->
      <ActionIconButton
        :tooltip="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :icon="isDark ? 'i-ph-sun-duotone' : 'i-ph-moon-duotone'"
        class="text-xl"
        @click="toggleDark()"
      />
    </div>
  </div>
</template>

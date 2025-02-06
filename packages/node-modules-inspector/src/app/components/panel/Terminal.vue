<script setup lang="ts">
import type { ITheme } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import themeDark from 'theme-vitesse/extra/xterm-vitesse-dark.json'
import themeLight from 'theme-vitesse/extra/xterm-vitesse-light.json'
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { openTerminal, showTerminal, terminal } from '~/state/terminal'
import { isDark } from '../../composables/dark'
import '@xterm/xterm/css/xterm.css'

const theme = computed<ITheme>(() => {
  return isDark.value
    ? { ...themeDark, background: '#00000000' }
    : { ...themeLight, background: '#00000000' }
})

const container = useTemplateRef<HTMLDivElement>('container')
terminal.value = new Terminal({
  customGlyphs: true,
  allowTransparency: true,
  theme: theme.value,
  fontFamily: 'DM Mono, monospace',
})

const fitAddon = new FitAddon()
terminal.value.loadAddon(fitAddon)

watch(theme, () => {
  terminal.value!.options.theme = theme.value
})

onMounted(() => {
  terminal.value!.open(container.value!)

  watch(
    showTerminal,
    () => {
      if (showTerminal.value) {
        fitAddon.fit()
      }
    },
    { immediate: true },
  )
})

onBeforeUnmount(() => {
  terminal.value?.dispose()
  terminal.value = undefined
})
</script>

<template>
  <div
    v-if="showTerminal"
    fixed bottom-4 right-4 z-panel-nav flex="~ gap-4 items-center"
    bg-glass rounded-full border border-base shadow
  >
    <button
      w-10 h-10 rounded-full hover:bg-active op50 hover:op100
      flex="~ items-center justify-center"
      title="Toggle Terminal"
      @click="openTerminal = !openTerminal"
    >
      <div i-ph-terminal-window-duotone text-xl />
    </button>
  </div>
  <div
    ref="container"
    flex fixed right-4 bottom-10
    w-200 h-100 bg-glass rounded border border-base shadow of-hidden
    :class="showTerminal && openTerminal ? '' : 'op0 pointer-events-none'"
  />
</template>

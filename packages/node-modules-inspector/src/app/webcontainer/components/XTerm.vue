<script setup lang="ts">
import type { ITheme } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import themeDark from 'theme-vitesse/extra/xterm-vitesse-dark.json'
import themeLight from 'theme-vitesse/extra/xterm-vitesse-light.json'
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { isDark } from '../../composables/dark'
import '@xterm/xterm/css/xterm.css'

const emit = defineEmits<{
  ready: [terminal: Terminal]
}>()

const theme = computed<ITheme>(() => {
  return isDark.value
    ? { ...themeDark, background: '#00000000' }
    : { ...themeLight, background: '#00000000' }
})

const container = useTemplateRef<HTMLDivElement>('container')
const terminal = new Terminal({
  customGlyphs: true,
  allowTransparency: true,
  theme: theme.value,
  fontFamily: 'DM Mono, monospace',
})

const fitAddon = new FitAddon()
terminal.loadAddon(fitAddon)

watch(theme, () => terminal.options.theme = theme.value)

onMounted(() => {
  terminal.open(container.value!)
  fitAddon.fit()

  emit('ready', terminal)
})

onBeforeUnmount(() => {
  terminal.dispose()
})
</script>

<template>
  <div ref="container" h-full w-full of-hidden />
</template>

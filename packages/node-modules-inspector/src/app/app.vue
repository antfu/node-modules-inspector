<script setup lang="ts">
import { useHead } from '@unhead/vue'

import Entry from './entries/index'
import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

useHead({
  title: 'Node Modules Inspector',
})
</script>

<template>
  <Entry />
  <PanelDark />
  <LazyPanelTerminal />
</template>

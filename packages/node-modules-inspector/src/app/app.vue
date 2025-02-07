<script setup lang="ts">
import { useHead } from '@unhead/vue'

import Entry from './entries/index'
import { setupQuery } from './state/query'
import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

useHead({
  title: 'Node Modules Inspector',
})

setupQuery()
</script>

<template>
  <Entry />
  <PanelDark />
  <LazyPanelTerminal />
</template>

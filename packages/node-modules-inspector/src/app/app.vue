<script setup lang="ts">
import { useHead } from '#imports'
import PanelNavRight from './components/panel/NavRight.vue'
import UiNoMobile from './components/ui/NoMobile.vue'

import Entry from './entries/index'
import { setupQuery } from './state/query'
import 'floating-vue/dist/style.css'
import '@antfu/design/styles.css'
import './styles/global.css'
import './composables/dark'

useHead({
  title: 'Node Modules Inspector',
})

setupQuery()
</script>

<template>
  <Entry />
  <UiNoMobile />
  <PanelNavRight />
</template>

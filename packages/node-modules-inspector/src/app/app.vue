<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { version } from '../../package.json'
import { wsConnecting } from './composables/rpc'
import { fetchListDependenciesData, packageData } from './state/data'

import { setupQuery } from './state/query'
import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

useHead({
  title: 'Node Modules Inspector',
})

setupQuery()
fetchListDependenciesData()
</script>

<template>
  <div v-if="wsConnecting || !packageData" flex="~ col" h-full w-full items-center justify-center p4>
    <div flex="~ col gap-2 items-center justify-center" flex-auto animate-pulse>
      <h1 p5 flex="~ col gap-1 items-center">
        <div>
          <Logo w-25 h-25 alt="Logo" class="animate-spin-reverse" />
        </div>
        <div flex="~ gap-1" leading-none text-2xl mt-5>
          <span font-700 text-primary>Node Modules</span>
          <span op75>Inspector</span>
        </div>
        <span font-mono op50>v{{ version }}</span>
      </h1>
      <div flex="~ gap-2 items-center" text-lg op50>
        Loading...
      </div>
    </div>
  </div>
  <div v-else>
    <PanelNav />
    <NuxtPage />
  </div>
</template>

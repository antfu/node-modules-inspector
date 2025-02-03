<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { version } from '../../package.json'
import { getBackend } from './backends'

import { fetchListDependenciesData, packageData } from './state/data'
import { setupQuery } from './state/query'
import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

useHead({
  title: 'Node Modules Inspector',
})

const backend = getBackend()
backend.connect()

setupQuery()
fetchListDependenciesData()
</script>

<template>
  <div v-if="backend.status.value !== 'connected' || !packageData" flex="~ col" h-full w-full items-center justify-center p4>
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
        <template v-if="backend.status.value === 'error' || backend.connectionError.value">
          <div badge-color-rose rounded px2>
            <div i-ph-warning-duotone text-rose text-2xl />
            <span>Failed to connect to backend</span>
            <span>{{ backend.connectionError.value }}</span>
          </div>
        </template>
        <template v-else-if="backend.status.value === 'connecting'">
          Connecting...
        </template>
        <template v-else-if="backend.status.value === 'connected'">
          Fetching data...
        </template>
      </div>
    </div>
  </div>
  <div v-else>
    <PanelNav />
    <NuxtPage />
  </div>
</template>

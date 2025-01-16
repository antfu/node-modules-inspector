<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { wsConnecting } from './composables/rpc'

import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

useHead({
  title: 'Node Modules Inspector',
})
</script>

<template>
  <div v-if="wsConnecting" flex="~ col" h-full w-full items-center justify-center p4>
    <div flex="~ gap-2 items-center" flex-auto animate-pulse text-xl>
      <div i-svg-spinners-90-ring-with-bg />
      Loading...
    </div>
  </div>
  <div v-else px4 py6 lg:px14 lg:py10>
    <NuxtPage />
  </div>
</template>

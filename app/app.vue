<script setup lang="ts">
import { useRuntimeConfig } from '#app/nuxt'
import { useHead } from '@unhead/vue'
import { errorInfo, init, isLoading } from '~/composables/payload'

import 'floating-vue/dist/style.css'
import './styles/global.css'
import './composables/dark'

const config = useRuntimeConfig()
init(config.app.baseURL)

useHead({
  title: 'Node Modules Inspector',
})
</script>

<template>
  <div v-if="errorInfo" grid h-full w-full place-content-center whitespace-pre-line p4>
    <div text-lg text-red font-mono>
      {{ errorInfo.error }}
    </div>
  </div>
  <div v-else-if="isLoading" flex="~ col" h-full w-full items-center justify-center p4>
    <div flex="~ gap-2 items-center" flex-auto animate-pulse text-xl>
      <div i-svg-spinners-90-ring-with-bg />
      Loading...
    </div>
  </div>
  <div v-else px4 py6 lg:px14 lg:py10>
    <NuxtPage />
  </div>
</template>

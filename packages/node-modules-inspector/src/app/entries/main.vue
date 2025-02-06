<script setup lang="ts">
import { computed, watch } from 'vue'
import { fetchPublishDates } from '~/state/publishDates'
import { setupQuery } from '~/state/query'
import { version } from '../../../package.json'
import { getBackend } from '../backends'
import { fetchData, rawData } from '../state/data'

const backend = getBackend()
backend.value!.connect()

const error = computed(() => {
  if (backend.value?.connectionError.value)
    return backend.value.connectionError.value
  if (backend.value?.status.value === 'error')
    return 'Connection failed'
  return null
})

setupQuery()
fetchData()

watch(() => rawData.value, async (deps) => {
  if (deps) {
    await fetchPublishDates(deps)
  }
}, { immediate: true })
</script>

<template>
  <div
    v-if="backend.status.value !== 'connected' || error || !rawData"
    flex="~ col" h-full w-full items-center justify-center p4
  >
    <div
      flex="~ col gap-2 items-center justify-center" flex-auto
      :class="error ? '' : 'animate-pulse'"
    >
      <h1 p5 flex="~ col gap-1 items-center">
        <div relative>
          <Logo
            w-25 h-25 alt="Logo" transition-all duration-300
            :class="error ? 'hue-rotate--105' : 'animate-spin-reverse'"
          />
          <div absolute top-0 right--2 text-orange transition-all duration-300 :class="error ? 'op100' : 'op0'">
            <div i-ph-warning-fill text-3xl />
          </div>
        </div>
        <div flex="~ gap-1" leading-none text-2xl mt-5>
          <span font-700 text-primary transition-all duration-300 :class="error ? 'hue-rotate--105' : ''">Node Modules</span>
          <span op75>Inspector</span>
        </div>
        <span font-mono op50>v{{ version }}</span>
      </h1>

      <div h-20>
        <div v-if="error" text-red rounded p2 flex="~ col items-center">
          <div font-bold>
            Failed to Connect to the Backend
          </div>
          <div text-red5 dark:text-red3>
            {{ error }}
          </div>
        </div>
        <div
          v-else-if="backend?.status.value === 'connected'"
          flex="~ gap-2 items-center" text-lg op50
        >
          Fetching data...
        </div>
        <div v-else flex="~ gap-2 items-center" text-lg op50>
          Connecting...
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <PanelDark />
    <PanelNav />
    <NuxtPage />
  </div>
</template>

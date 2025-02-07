<script setup lang="ts">
import type { Backend } from '~/types/backend'
import { computed } from 'vue'
import { backend } from '../backends'
import { rawData } from '../state/data'

const props = defineProps<{
  backend?: Backend | undefined
  error?: unknown
}>()

const error = computed(() => {
  if (props.error)
    return props.error
  if (backend.value?.connectionError.value)
    return backend.value.connectionError.value
  if (backend.value?.status.value === 'error')
    return 'Connection failed'
  return null
})

const isLoading = computed(() => Boolean(!backend.value || backend.value?.status.value !== 'connected' || error.value || !rawData.value))
</script>

<template>
  <div
    v-if="isLoading"
    flex="~ col" h-full w-full items-center justify-center p4
  >
    <div flex="~ col gap-2 items-center justify-center" flex-auto>
      <UiTitle :has-error="!!error" :is-loading="isLoading" />
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
    <PanelNav />
    <NuxtPage />
  </div>
</template>

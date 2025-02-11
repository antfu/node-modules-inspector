<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { backend } from '~/backends'
import { fetchData, rawData } from '~/state/data'
import { query } from '~/state/query'
import { openTerminal, showTerminal } from '~/state/terminal'
import MainEntry from '../entries/main.vue'
import { getContainer, install } from './container'

showTerminal.value = true
const input = shallowRef(query.install?.trim().replace(/\+/g, ' ') || '')
const error = shallowRef<any>()
const isLoading = shallowRef(false)

onMounted(() => {
  getContainer()
  if (input.value)
    run()
})

async function run() {
  isLoading.value = true
  query.install = input.value.replace(/\s+/g, '+')
  try {
    openTerminal.value = true
    backend.value = await install(input.value.split(' '))
    await fetchData()
    openTerminal.value = false
  }
  catch (e) {
    console.error(e)
    error.value = e
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <template v-if="!backend && !rawData">
    <div flex="~ col items-center gap-5" p10>
      <div min-h-120 flex="~ col gap-2 items-center justify-center" flex-auto>
        <UiTitle :has-error="!!error" :is-loading="isLoading" />
        <label
          border="~ base rounded-full" bg-glass shadow transition-all
          flex="~ gap-2 items-center" py3 px8 mt5 text-lg
          focus-within="shadow-xl ring-4 ring-primary:10"
        >
          <div flex-none font-mono select-none>
            <span text-orange>pnpm</span> <span op50>install</span>
          </div>
          <input
            v-model="input"
            placeholder="Enter package names"
            :disabled="isLoading"
            w-120 px1 py2 font-mono bg-transparent outline-none
            placeholder-gray:40
            @keydown.enter="run"
          >
        </label>

        <div text-center p2 op35 italic>
          This will run a pnpm install inside your browser with <a href="https://webcontainers.io/" target="_blank" hover:underline>WebContainer</a>.
        </div>
        <div w-10 border="t base" my4 />
        <div p2>
          <span op35>You can also run this locally at your project root with</span> <code badge-color-gray font-mono px2 rounded>pnpx <span text-primary:90>node-modules-inspector</span></code>.
        </div>

        <div v-if="error" h-20 text-red rounded p2 flex="~ col items-center">
          <div font-bold>
            Failed to Connect to the Backend
          </div>
          <div text-red5 dark:text-red3>
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </template>
  <MainEntry v-else />
  <LazyPanelTerminal />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { version } from '../../../../package.json'

const input = shallowRef('')
const error = shallowRef<any>()
const isLoading = shallowRef(false)
</script>

<template>
  <div>
    <div min-h-150 flex="~ col gap-2 items-center justify-center" flex-auto>
      <h1 p5 flex="~ col gap-3 items-center">
        <div relative>
          <Logo
            w-30 h-30 alt="Logo" transition-all duration-300
            :class="error ? 'hue-rotate--105' : isLoading ? 'animate-spin-reverse' : ''"
          />
          <div absolute top-0 right--2 text-orange transition-all duration-300 :class="error ? 'op100' : 'op0'">
            <div i-ph-warning-fill text-3xl />
          </div>
        </div>
        <div flex="~ gap-1" leading-none text-3xl mt-5>
          <span font-700 text-primary transition-all duration-300 :class="error ? 'hue-rotate--105' : ''">Node Modules</span>
          <span op75>Inspector</span>
          <span font-mono op50 text-sm mr--12>v{{ version }}</span>
        </div>
        <div op50 text-center>
          Visualize your node_modules, inspect dependencies, and more.
        </div>
      </h1>

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
          w-120
          placeholder-gray:40
          outline-none bg-transparent px1 py2 font-mono
        >
      </label>

      <div text-center p2 op30 italic>
        This will run a pnpm install inside your browser with <a href="https://webcontainers.io/" target="_blank" hover:underline>WebContainer</a>.
      </div>

      <!-- <div h-20>
        <div v-if="error" text-red rounded p2 flex="~ col items-center">
          <div font-bold>
            Failed to Connect to the Backend
          </div>
          <div text-red5 dark:text-red3>
            {{ error }}
          </div>
        </div>
      </div> -->
    </div>
  </div>
  <PanelDark />
</template>

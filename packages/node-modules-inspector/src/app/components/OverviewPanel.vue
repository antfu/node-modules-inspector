<script setup lang="ts">
import { packageData } from '~/state/data'
import { version } from '../../../package.json'
</script>

<template>
  <div flex="~ col gap-2">
    <h1 text-lg border="b base" p5 flex="~ gap-3 items-center">
      <Logo w-9 h-9 alt="Logo" />
      <div flex="~ col gap-0" leading-none>
        <span font-700 text-primary>Node Modules</span>
        <span op75>Inspector</span>
      </div>
      <div flex-auto />
      <span font-mono op50 text-sm>v{{ version }}</span>
    </h1>
    <div v-if="packageData" flex="~ col gap-3" p5>
      <button flex="~ gap-2 items-center" @click="rpc.openInFinder(packageData.cwd)">
        <div i-catppuccin-folder-node-open icon-catppuccin flex-none />
        <span font-mono break-after-all text-left leading-none>{{ packageData.cwd }}</span>
      </button>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-pnpm icon-catppuccin flex-none />
        <span>{{ packageData.packageManager }}</span>
      </div>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-java-class icon-catppuccin flex-none />
        <span>{{ packageData.packages.size }} packages</span>
      </div>
    </div>
  </div>
</template>

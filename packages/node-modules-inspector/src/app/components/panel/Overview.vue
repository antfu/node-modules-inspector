<script setup lang="ts">
import { packageData } from '~/state/data'
import { filteredPackages, workspacePackages } from '~/state/filters'
import { version } from '../../../../package.json'
</script>

<template>
  <div flex="~ col">
    <h1 text-lg p5 flex="~ gap-3 items-center">
      <Logo w-9 h-9 alt="Logo" class="hover:animate-spin-reverse" />
      <div flex="~ col gap-0" leading-none>
        <span font-700 text-primary>Node Modules</span>
        <span op75>Inspector</span>
      </div>
      <div flex-auto />
      <span font-mono op50 text-sm>v{{ version }}</span>
    </h1>
    <div v-if="packageData" border="t base" flex="~ col gap-3" p5>
      <button flex="~ gap-2 items-center" @click="rpc.openInFinder(packageData.cwd)">
        <div i-catppuccin-folder-node-open icon-catppuccin flex-none />
        <span font-mono break-after-all text-left leading-none>{{ packageData.cwd }}</span>
      </button>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-pnpm icon-catppuccin flex-none />
        <span>{{ packageData.packageManager }}</span>
      </div>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-folder-packages-open icon-catppuccin flex-none />
        <DisplayNumberBadge :number="workspacePackages.length" rounded-full text-sm mx--0.2 mt-3px />
        <span ml--0.5>workspace packages</span>
      </div>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-java-class icon-catppuccin flex-none />
        <DisplayNumberBadge :number="packageData.packages.size" rounded-full text-sm mx--0.2 mt-3px />
        <span ml--0.5>packages</span>
      </div>
    </div>
    <div>
      <ModuleTypePercentage :packages="filteredPackages" :rounded="false" />
    </div>
    <div border="t base" flex="~ gap-1.1 items-center" p3 pl5 pr4 text-hex-888e>
      Made with
      <div i-logos-nuxt-icon text-0.6rem mr--0.6 />
      <span text-green>Nuxt</span>
      and
      <div i-ph-heart-duotone text-rose />
      by
      <a href="https://github.com/antfu" target="_blank" rel="noopener" hover="underline">Anthony Fu</a>
      <div flex-auto />
      <a href="https://github.com/antfu/node-modules-inspector" target="_blank" rel="noopener" op50 hover:op100>
        <div i-ri-github-fill text-lg />
      </a>
    </div>
  </div>
</template>

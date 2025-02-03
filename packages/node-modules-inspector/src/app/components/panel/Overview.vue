<script setup lang="ts">
import { getBackend } from '~/backends'
import { rawData } from '~/state/data'
import { payload } from '~/state/payload'
import { version } from '../../../../package.json'

const backend = getBackend()
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
      <span font-mono text-sm flex="~ col items-end">
        <div badge-color-lime rounded px2 mr--2 text-xs py0.5>Preview</div>
        <span op50>v{{ version }}</span>
      </span>
    </h1>
    <div v-if="rawData" border="t base" flex="~ col gap-3" p5>
      <button
        flex="~ gap-2 items-center"
        @click="backend.functions.openInFinder?.(rawData.root)"
      >
        <div i-catppuccin-folder-node-open icon-catppuccin flex-none />
        <span font-mono break-after-all text-left leading-none>{{ rawData.root }}</span>
      </button>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-pnpm icon-catppuccin flex-none />
        <span>{{ rawData.packageManager }}</span>
        <DisplayVersion :version="rawData.packageManagerVersion" prefix="@" op75 />
      </div>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-folder-packages-open icon-catppuccin flex-none />
        <DisplayNumberBadge :number="payload.workspace.packages.length" rounded-full text-sm mx--0.2 mt-3px />
        <span ml--0.5>workspace packages</span>
      </div>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-java-class icon-catppuccin flex-none />
        <DisplayNumberBadge :number="payload.avaliable.packages.length" rounded-full text-sm mx--0.2 mt-3px />
        <span ml--0.5>packages</span>
      </div>
    </div>
    <div>
      <ModuleTypePercentage :packages="payload.avaliable.packages" :rounded="false" />
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

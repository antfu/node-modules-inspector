<script setup lang="ts">
import { computed } from 'vue'
import { version } from '../../../../package.json'
import { getBackend } from '../../backends'
import { rawPayload } from '../../state/data'
import { getDeprecatedInfo, payloads, totalWorkspaceSize } from '../../state/payload'
import { settings } from '../../state/settings'
import { getFundings } from '../../utils/package-json'

const backend = getBackend()

const totalDeprecatedCount = computed(() => Array.from(payloads.filtered.packages)
  .filter(pkg => getDeprecatedInfo(pkg)?.current)
  .length)

const multipleVersionsCount = computed(() => Array.from(payloads.avaliable.versions.values())
  .filter(v => v.length > 1)
  .length)

const fundingCount = computed(() => payloads.avaliable.packages
  .filter(p => getFundings(p))
  .length)

const licensesCount = computed(() => {
  const set = new Set<string>()
  payloads.avaliable.packages.forEach((p) => {
    set.add(p.resolved.packageJson.license || '<Unspecified>')
  })
  return set.size
})

const mins10 = 10 * 60 * 1000
const timepassed = computed(() => rawPayload.value?.timestamp ? Date.now() - rawPayload.value.timestamp : 0)
</script>

<template>
  <div flex="~ col">
    <h1 text-lg p4 flex="~ gap-3 items-center">
      <UiLogo w-9 h-9 alt="Logo" class="hover:animate-spin-reverse" />
      <div flex="~ col gap-0" leading-none>
        <span font-700 text-primary>Node Modules</span>
        <div flex="~ gap-1 items-end">
          <div op75>
            Inspector
          </div>
          <div op50 text-xs font-mono>
            v{{ version }}
          </div>
        </div>
      </div>
      <div flex-auto />
      <button
        v-tooltip="'Collapse sidepanel'"
        w-10 h-10 mr--2
        rounded-full op30
        hover="op100 bg-active"
        title="Collapse sidepanel"
        flex="~ items-center justify-center"
        @click="settings.collapseSidepanel = !settings.collapseSidepanel"
      >
        <div i-ph-caret-double-left />
      </button>
    </h1>
    <div v-if="rawPayload" border="t base" flex="~ col gap-3" p5>
      <div
        v-if="backend.name === 'webcontainer'"
        flex="~ gap-2 items-center"
      >
        <div i-catppuccin-stackblitz icon-catppuccin flex-none />
        <a break-after-all text-left leading-none href="https://webcontainers.io/" target="_blank" hover="underline">WebContainer</a>
      </div>
      <button
        v-else
        flex="~ gap-2 items-center"
        @click="backend.functions.openInFinder?.(rawPayload.root)"
      >
        <div i-catppuccin-folder-node-open icon-catppuccin flex-none />
        <span font-mono break-after-all text-left leading-none>{{ rawPayload.config?.name ?? rawPayload.root }}</span>
      </button>
      <div flex="~ gap-2 items-center">
        <div v-if="rawPayload.packageManager === 'pnpm'" i-catppuccin-pnpm icon-catppuccin flex-none />
        <div v-else-if="rawPayload.packageManager === 'npm'" i-catppuccin-npm icon-catppuccin flex-none />
        <span>{{ rawPayload.packageManager }}</span>
        <DisplayVersion :version="rawPayload.packageManagerVersion" prefix="@" op75 />
      </div>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-folder-packages-open icon-catppuccin flex-none />
        <DisplayNumberBadge :number="payloads.workspace.packages.length" rounded-full text-sm mx--0.2 mt-3px color="badge-color-yellow" />
        <span ml--0.5>workspace packages</span>
      </div>
      <NuxtLink flex="~ gap-2 items-center" to="/grid">
        <div i-catppuccin-java-class icon-catppuccin flex-none />
        <DisplayNumberBadge :number="payloads.avaliable.packages.length" rounded-full text-sm mx--0.2 mt-3px color="badge-color-primary" />
        <span ml--0.5>total packages</span>
      </NuxtLink>
      <NuxtLink v-if="totalDeprecatedCount" flex="~ gap-2 items-center" to="/report/deprecated">
        <div i-ph-warning-duotone flex-none text-red />
        <DisplayNumberBadge :number="totalDeprecatedCount" rounded-full text-sm mx--0.2 mt-3px color="badge-color-red" />
        <span ml--0.5 text-red>deprecated packages</span>
      </NuxtLink>
      <NuxtLink v-if="multipleVersionsCount" flex="~ gap-2 items-center" to="/report/multiple-versions">
        <div i-catppuccin-java-enum icon-catppuccin flex-none />
        <DisplayNumberBadge :number="multipleVersionsCount" rounded-full text-sm mx--0.2 mt-3px color="badge-color-orange" />
        <span ml--0.5>libraries with multiple versions</span>
      </NuxtLink>
      <NuxtLink flex="~ gap-2 items-center" to="/report/licenses">
        <div i-catppuccin-license icon-catppuccin flex-none />
        <DisplayNumberBadge :number="licensesCount" rounded-full text-sm mx--0.2 mt-3px color="badge-color-amber" />
        <span ml--0.5>type of licenses</span>
      </NuxtLink>
      <NuxtLink flex="~ gap-2 items-center" to="/report/funding">
        <div i-catppuccin-code-of-conduct icon-catppuccin flex-none />
        <DisplayNumberBadge :number="fundingCount" rounded-full text-sm mx--0.2 mt-3px color="badge-color-pink" />
        <span ml--0.5>packages request for funding</span>
      </NuxtLink>
      <NuxtLink flex="~ gap-2 items-center" to="/report/install-size">
        <div i-catppuccin-binary icon-catppuccin flex-none />
        <DisplayFileSizeBadge :bytes="totalWorkspaceSize" :precent="false" rounded-full text-sm mx--0.2 mt-3px color="badge-color-primary" />
        <span ml--0.5>total node_modules size</span>
      </NuxtLink>
      <div v-if="timepassed >= mins10" flex="~ gap-2 items-center">
        <div i-catppuccin-changelog icon-catppuccin flex-none />
        <DisplayDateBadge :time="rawPayload.timestamp" :colorize="false" rounded-full text-sm mx--0.2 mt-3px color="badge-color-primary" />
        <span ml--0.5>last updated</span>
      </div>
    </div>
    <div>
      <UiPercentageModuleType :packages="payloads.avaliable.packages" :rounded="false" />
    </div>
    <UiCredits border="t base" />
  </div>
</template>

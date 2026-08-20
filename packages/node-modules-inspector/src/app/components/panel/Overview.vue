<script setup lang="ts">
import DisplayNumberBadge from '@antfu/design/components/Display/DisplayNumberBadge.vue'
import DisplayVersion from '@antfu/design/components/Display/DisplayVersion.vue'
import { computed } from 'vue'
import { NuxtLink } from '#components'
import { version } from '../../../../package.json'
import { getBackend } from '../../backends'
import { rawPayload } from '../../state/data'
import { getDeprecatedInfo, payloads, totalWorkspaceSize } from '../../state/payload'
import { settings } from '../../state/settings'
import DisplayDateBadge from '../display/DateBadge.vue'
import DisplayFileSizeBadge from '../display/FileSizeBadge.vue'
import UiCredits from '../ui/Credits.vue'
import UiLogo from '../ui/Logo.vue'
import UiPercentageModuleType from '../ui/PercentageModuleType.vue'

const location = window.location

const backend = getBackend()

const totalDeprecatedCount = computed(() => Array.from(payloads.filtered.packages)
  .filter(pkg => getDeprecatedInfo(pkg)?.current)
  .length)

const multipleVersionsCount = computed(() => Array.from(payloads.available.versions.values())
  .filter(v => v.length > 1)
  .length)

const fundingCount = computed(() => payloads.available.packages
  .filter(p => p.resolved.fundings?.length)
  .length)

const licensesCount = computed(() => {
  const set = new Set<string>()
  payloads.available.packages.forEach((p) => {
    set.add(p.resolved.license || '<Unspecified>')
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
        <!-- `dark:text-primary-300` — the DEFAULT shade (#49833e) only clears
             ~4.14:1 against the dark-mode page background (axe-core-measured;
             this 18px-bold text is just under axe's large-text exemption). -->
        <span font-700 text-primary dark:text-primary-300>Node Modules</span>
        <div flex="~ gap-1 items-end">
          <div op75>
            Inspector
          </div>
          <div op-fade text-xs font-mono>
            v{{ version }}
          </div>
        </div>
      </div>
      <div flex-auto />
      <button
        v-tooltip="'Collapse sidepanel'"
        w-10 h-10 mr--2
        rounded-full op30
        hover="op100 bg-hover"
        title="Collapse sidepanel"
        flex="~ items-center justify-center"
        @click="settings.collapseSidepanel = !settings.collapseSidepanel"
      >
        <div i-ph-caret-double-left />
      </button>
    </h1>
    <div v-if="rawPayload" border="t base" flex="~ col gap-3" p5>
      <div
        v-if="backend.name === 'registry'"
        flex="~ gap-2 items-center"
      >
        <div i-catppuccin-npm icon-catppuccin flex-none />
        <span>npm registry</span>
        <span
          v-tooltip="'The graph is resolved from registry metadata without a real install — versions, deduplication, and sizes are approximate. Use Sandbox Install mode for full fidelity.'"
          badge-color-amber px1.5 rounded text-xs
        >approximate</span>
      </div>
      <div
        v-else-if="backend.name === 'webcontainer'"
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
      <div v-if="rawPayload.packageManager !== 'npm-registry'" flex="~ gap-2 items-center">
        <div v-if="rawPayload.packageManager === 'pnpm'" i-catppuccin-pnpm icon-catppuccin flex-none />
        <div v-else-if="rawPayload.packageManager === 'npm'" i-catppuccin-npm icon-catppuccin flex-none />
        <span>{{ rawPayload.packageManager }}</span>
        <DisplayVersion v-if="rawPayload.packageManagerVersion" :version="rawPayload.packageManagerVersion" text-xs prefix="@" op75 />
      </div>
      <div flex="~ gap-2 items-center">
        <div i-catppuccin-folder-packages-open icon-catppuccin flex-none />
        <DisplayNumberBadge :value="payloads.workspace.packages.length" text-xs color="yellow" />
        <span ml--0.5>workspace packages</span>
      </div>
      <NuxtLink flex="~ gap-2 items-center" :to="{ path: '/grid/depth', hash: location.hash }">
        <div i-catppuccin-java-class icon-catppuccin flex-none />
        <DisplayNumberBadge :value="payloads.available.packages.length" text-xs color="primary" />
        <span ml--0.5>total packages</span>
      </NuxtLink>
      <NuxtLink v-if="totalDeprecatedCount" flex="~ gap-2 items-center" :to="{ path: '/report/deprecated', hash: location.hash }">
        <div i-ph-warning-duotone flex-none color-deprecated />
        <DisplayNumberBadge :value="totalDeprecatedCount" text-xs color="red" color-deprecated />
        <span ml--0.5 color-deprecated>deprecated packages</span>
      </NuxtLink>
      <NuxtLink v-if="multipleVersionsCount" flex="~ gap-2 items-center" :to="{ path: '/report/multiple-versions', hash: location.hash }">
        <div i-catppuccin-java-enum icon-catppuccin flex-none />
        <DisplayNumberBadge :value="multipleVersionsCount" text-xs color="orange" />
        <span ml--0.5>libraries with multiple versions</span>
      </NuxtLink>
      <NuxtLink flex="~ gap-2 items-center" :to="{ path: '/report/licenses', hash: location.hash }">
        <div i-catppuccin-license icon-catppuccin flex-none />
        <DisplayNumberBadge :value="licensesCount" text-xs color="amber" />
        <span ml--0.5>type of licenses</span>
      </NuxtLink>
      <NuxtLink flex="~ gap-2 items-center" :to="{ path: '/report/funding', hash: location.hash }">
        <div i-catppuccin-code-of-conduct icon-catppuccin flex-none />
        <DisplayNumberBadge :value="fundingCount" text-xs color="pink" />
        <span ml--0.5>packages request for funding</span>
      </NuxtLink>
      <NuxtLink flex="~ gap-2 items-center" :to="{ path: '/report/install-size', hash: location.hash }">
        <div i-catppuccin-binary icon-catppuccin flex-none />
        <!-- `color="primary"` isn't a real prop of `FileSizeBadge` — it falls
             through onto the root element as a bare attribute, and (as an
             attributify `text-primary` equivalent) only wins over the
             component's own internal `color-scale-*` class by generation-order
             luck. `!`-suffixed classes force it, and `-700`/`dark:-300` clear
             4.5:1 at this badge's small text size (`text-primary` DEFAULT was
             4.37:1, axe-core-measured). -->
        <DisplayFileSizeBadge :bytes="totalWorkspaceSize" :percent="false" rounded-full text-xs class="text-primary-700! dark:text-primary-300!" />
        <span ml--0.5>total node_modules size</span>
      </NuxtLink>
      <div v-if="timepassed >= mins10" flex="~ gap-2 items-center">
        <div i-catppuccin-changelog icon-catppuccin flex-none />
        <DisplayDateBadge :time="rawPayload.timestamp" :colorize="false" rounded-full text-xs color="primary" />
        <span ml--0.5>last updated</span>
      </div>
    </div>
    <div>
      <UiPercentageModuleType :packages="payloads.available.packages" :rounded="false" />
    </div>
    <UiCredits border="t base" />
  </div>
</template>

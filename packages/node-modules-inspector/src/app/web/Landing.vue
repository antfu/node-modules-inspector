<script setup lang="ts">
import type { InstallExcludeSpec } from 'node-modules-tools/registry'
import { parseInstallSpecs } from 'node-modules-tools/registry'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { backend } from '../backends'
import RegistryWarnings from '../components/registry/Warnings.vue'
import UiCredits from '../components/ui/Credits.vue'
import UiTitle from '../components/ui/Title.vue'
import MainEntry from '../entries/main.vue'
import { createRegistryBackend, registryProgress } from '../registry'
import { fetchData, rawPayload } from '../state/data'
import { query } from '../state/query'
import { openTerminal, showTerminal } from '../state/terminal'

type WebMode = 'instant' | 'sandbox'

// The WebContainer SDK (`@webcontainer/api`) is heavy and only needed for
// "Sandbox Install" mode. Load `./container` lazily so the default Instant
// (npm-registry) mode never pulls the SDK into the initial bundle.
function loadContainer() {
  return import('../webcontainer/container')
}

function bootContainer() {
  loadContainer().then(({ getContainer }) => getContainer())
}

const mode = shallowRef<WebMode>(query.mode === 'sandbox' ? 'sandbox' : 'instant')
const input = shallowRef(query.install?.trim().replace(/\+/g, ' ') || '')
const packageJson = shallowRef<{ name?: string, dependencies: Record<string, string> } | null>(null)
const error = shallowRef<any>()
const isLoading = shallowRef(false)
const isComposing = ref(false)
const isDragging = shallowRef(false)
const fallbackNotice = shallowRef(false)

function setMode(value: WebMode) {
  mode.value = value
  query.mode = value === 'sandbox' ? 'sandbox' : ''
  if (value === 'sandbox')
    bootContainer()
}

function handleCompositionEnd(_event: CompositionEvent) {
  isComposing.value = false
  run()
}

onMounted(() => {
  if (mode.value === 'sandbox')
    bootContainer()
  run()
})

function tryUsePackageJson(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed.startsWith('{'))
    return false
  try {
    const json = JSON.parse(trimmed)
    if (!json || typeof json !== 'object' || typeof json.dependencies !== 'object' || !json.dependencies)
      return false
    packageJson.value = { name: json.name, dependencies: json.dependencies }
    input.value = ''
    query.install = ''
    error.value = undefined
    return true
  }
  catch {
    return false
  }
}

function handlePaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text')
  if (text && tryUsePackageJson(text)) {
    event.preventDefault()
    run()
  }
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file)
    return
  const text = await file.text()
  if (tryUsePackageJson(text))
    run()
  else
    error.value = new Error(`"${file.name}" does not look like a package.json with dependencies`)
}

function clearPackageJson() {
  packageJson.value = null
}

const dependencies = computed<Record<string, string> | null>(() => {
  if (packageJson.value)
    return packageJson.value.dependencies
  const trimmed = input.value?.trim()
  if (!trimmed)
    return null
  return parseInstallSpecs(trimmed).dependencies
})

const excludes = computed<InstallExcludeSpec[]>(() => {
  if (packageJson.value)
    return []
  const trimmed = input.value?.trim()
  if (!trimmed)
    return []
  return parseInstallSpecs(trimmed).excludes
})

const progressText = computed(() => {
  if (registryProgress.phase === 'manifests')
    return `Fetching package manifests ${registryProgress.count} / ${registryProgress.total}`
  return `Resolved ${registryProgress.count} packages...`
})

const progressPercent = computed(() => {
  if (registryProgress.phase === 'manifests' && registryProgress.total)
    return `${Math.round(registryProgress.count / registryProgress.total * 100)}%`
  // The total is unknown while resolving — ease towards 90%
  return `${Math.round(registryProgress.count / (registryProgress.count + 20) * 90)}%`
})

async function run() {
  const deps = dependencies.value
  if (!deps || !Object.keys(deps).length) {
    input.value = ''
    return
  }

  isLoading.value = true
  error.value = undefined
  if (!packageJson.value)
    query.install = input.value.trim().replace(/\s+/g, '+')

  try {
    if (mode.value === 'sandbox')
      await runSandbox(deps)
    else
      await runInstant(deps)
  }
  catch (e) {
    console.error(e)
    error.value = e
  }
  finally {
    isLoading.value = false
  }
}

async function runInstant(deps: Record<string, string>) {
  backend.value = createRegistryBackend(deps, { name: packageJson.value?.name, excludes: excludes.value })
  await fetchData(false, true)
}

async function runSandbox(deps: Record<string, string>) {
  const args = Object.entries(deps)
    .map(([name, range]) => (!range || range === '*') ? name : `${name}@${range}`)
  try {
    showTerminal.value = true
    openTerminal.value = true
    const { install } = await loadContainer()
    backend.value = await install(args)
    await fetchData(false, true)
    openTerminal.value = true
  }
  catch (e) {
    console.error(e)
    // The WebContainer could not boot (e.g. missing cross-origin isolation) —
    // fall back to Instant mode automatically.
    openTerminal.value = false
    showTerminal.value = false
    setMode('instant')
    fallbackNotice.value = true
    await runInstant(deps)
  }
}
</script>

<template>
  <template v-if="!backend || !rawPayload">
    <div
      flex="~ col items-center gap-5" p10
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <div min-h-120 flex="~ col gap-2 items-center justify-center" flex-auto>
        <UiTitle :has-error="!!error" :is-loading="isLoading" />

        <div
          flex="~ items-center" border="~ base rounded-full" bg-glass shadow-sm
          text-sm select-none of-hidden mb2
        >
          <button
            px4 py1.5 rounded-full transition-colors
            :class="mode === 'instant' ? 'bg-primary:10 text-primary' : 'op50 hover:op100'"
            @click="setMode('instant')"
          >
            Registry Query
          </button>
          <button
            px4 py1.5 rounded-full transition-colors
            :class="mode === 'sandbox' ? 'bg-primary:10 text-primary' : 'op50 hover:op100'"
            @click="setMode('sandbox')"
          >
            Sandbox Install
          </button>
        </div>

        <div
          v-if="packageJson"
          border="~ base rounded-full" bg-glass shadow transition-all
          flex="~ gap-3 items-center" py3 px8 text-lg
        >
          <div i-catppuccin-package-json icon-catppuccin flex-none />
          <span font-mono>{{ packageJson.name || 'package.json' }}</span>
          <span op50 text-sm>{{ Object.keys(packageJson.dependencies).length }} dependencies</span>
          <button
            v-tooltip="'Clear'"
            op50 hover:op100 flex="~ items-center justify-center"
            :disabled="isLoading"
            @click="clearPackageJson()"
          >
            <div i-ph-x />
          </button>
        </div>
        <label
          v-else
          border="~ base rounded-full" bg-glass shadow transition-all w-180
          flex="~ gap-2 items-center" py3 px8 text-lg
          focus-within="shadow-xl ring-4 ring-primary:10"
          :class="isDragging ? 'ring-4 ring-primary:20' : ''"
        >
          <div flex-none font-mono select-none flex="~ gap-2 items-center">
            <template v-if="mode === 'sandbox'">
              <span text-orange>pnpm</span> <span op-fade>install</span>
            </template>
            <template v-else>
              <span text-primary>query</span>
            </template>
          </div>
          <input
            v-model="input"
            placeholder="enter package names"
            :disabled="isLoading"
            w-full px1 py2 font-mono bg-transparent outline-none
            placeholder-gray:40
            @keydown.enter="!isComposing && run()"
            @compositionstart="isComposing = true"
            @compositionend="handleCompositionEnd"
            @paste="handlePaste"
          >
        </label>
        <div text-center transition duration-50 op50>
          <template v-if="mode === 'sandbox'">
            This will run a full pnpm install inside your browser with <a href="https://webcontainers.io/" target="_blank" font-bold hover:underline>WebContainer</a>. Slower but most accurate.
          </template>
          <template v-else>
            Dependencies are resolved by directly querying <a href="https://registry.npmjs.org" target="_blank" font-bold hover:underline>npm registry</a>, less accurate but faster.
          </template>
        </div>

        <div v-if="isLoading && mode === 'instant'" w-180 flex="~ col gap-2 items-center" mt2>
          <div h-1 w-full rounded-full bg-gray:15 of-hidden>
            <div h-full rounded-full bg-primary transition-all duration-300 :style="{ width: progressPercent }" />
          </div>
          <div text-sm op50 font-mono>
            {{ progressText }}
          </div>
        </div>

        <div v-if="fallbackNotice" rounded-lg badge-color-amber px4 py2 flex="~ gap-2 items-center" text-sm>
          <div i-ph-warning-duotone flex-none />
          <span>WebContainer failed to boot in this browser — switched to Instant mode.</span>
          <button op50 hover:op100 flex-none flex="~ items-center" @click="fallbackNotice = false">
            <div i-ph-x />
          </button>
        </div>

        <div v-if="error" text-red rounded p2 flex="~ col items-center">
          <div font-bold>
            {{ mode === 'sandbox' ? 'Failed to Connect to the Backend' : 'Failed to Resolve Dependencies' }}
          </div>
          <div text-red5 dark:text-red3>
            {{ error }}
          </div>
        </div>

        <div p2 mt10 text-center flex="~ col gap-2">
          <div op35>
            Paste or drop a package.json to inspect a whole project.
          </div>
          <div>
            <span op35>Or run in your local project with</span> <a href="https://github.com/antfu/node-modules-inspector" target="_blank"><code badge-color-gray important-bg-gray:3 font-mono px2 py1 rounded>pnpx <span text-primary:90>node-modules-inspector</span></code></a>
          </div>
          <div>
            <span op35>Or see a static build demo at </span><a href="https://everything.antfu.dev" target="_blank" op-fade hover="op100 underline text-primary">everything.antfu.dev</a>
          </div>
        </div>
        <div absolute left-0 right-0 bottom-0 flex="~ col items-center gap-2" p4>
          <div text-sm>
            <span op35>Tips: prefix package names with</span> <code badge-color-gray text-sm important-bg-gray:3 font-mono px1 rounded>-</code> <span op35>to exclude them from the graph. For example, </span><code badge-color-gray important-bg-gray:3 font-mono px1 rounded>nuxt -vite</code> <span op35> shows deps of Nuxt without Vite.</span>
          </div>
          <UiCredits />
        </div>
      </div>
    </div>
  </template>
  <MainEntry v-else />
  <RegistryWarnings />
  <LazyPanelTerminal />
</template>

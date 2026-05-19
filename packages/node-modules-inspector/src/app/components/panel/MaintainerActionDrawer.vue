<script setup lang="ts">
import { onKeyStroke, useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { selectedAction, selectedNode } from '../../state/current'
import { query } from '../../state/query'
import { buildAgentPrompt } from '../../utils/maintainer-action-templates'
import { getPackageData } from '../../utils/package-json'

const item = computed(() => selectedAction.value)

const data = computed(() => item.value ? getPackageData(item.value.consumer) : undefined)
const repoUrl = computed(() => data.value?.repository || data.value?.homepage)

const agentPrompt = computed(() => item.value ? buildAgentPrompt(item.value) : '')
const { copy, copied } = useClipboard({ source: agentPrompt, copiedDuring: 1500 })

const ratioPct = computed(() => item.value ? Math.round(item.value.migrationRatio * 100) : 0)

const blockLabel = computed(() => item.value?.depType === 'peer' ? 'peerDependencies' : 'dependencies')

function close() {
  query.selectedAction = undefined
}

function openConsumer() {
  if (item.value) {
    selectedNode.value = item.value.consumer
    close()
  }
}

onKeyStroke('Escape', () => {
  if (item.value)
    close()
})
</script>

<template>
  <Transition name="drawer-backdrop">
    <div
      v-if="item"
      fixed inset-0 z-drawer-backdrop bg-black:30
      @click="close"
    />
  </Transition>
  <Transition name="drawer-panel">
    <div
      v-if="item"
      fixed right-0 top-0 bottom-0 z-drawer-content
      w-180 max-w-90vw bg-base
      border="l base" shadow-2xl
      flex="~ col" of-hidden
    >
      <button
        absolute top-2 right-2 z-1
        w-10 h-10 rounded-full op30
        hover="op100 bg-active"
        flex="~ items-center justify-center"
        title="Close"
        @click="close"
      >
        <div i-ph-x />
      </button>

      <div of-y-auto flex-auto p6 pb8>
        <div text-xs op-fade uppercase tracking-wider flex="~ items-center gap-1" mb2>
          <div i-ph-arrow-fat-up-duotone />
          Upgrade
          <span px1.5 py0.5 rounded font-mono uppercase :class="item.depType === 'peer' ? 'badge-color-purple' : 'badge-color-primary'">
            {{ item.depType }}
          </span>
        </div>

        <div font-mono text-3xl mb3>
          {{ item.depName }}
        </div>

        <div flex="~ items-center gap-3 wrap" font-mono mb1>
          <span px2 py1 rounded badge-color-red>{{ item.declaredRange }}</span>
          <div i-ph-arrow-right op-fade text-xl />
          <span px2 py1 rounded badge-color-green>v{{ item.installedHighestVersion }}</span>
        </div>

        <div v-if="item.catalogName" text-xs op-fade mb4>
          Resolved from <code font-mono>{{ item.rawRange }}</code> in <code font-mono>pnpm-workspace.yaml</code>.
        </div>
        <div v-else mb4 />

        <div border="t base" my4 />

        <div text-xs op-fade uppercase tracking-wider mb2>
          In package
        </div>
        <div flex="~ items-center gap-2 wrap">
          <button
            font-mono text-lg op80 hover:text-primary
            @click="openConsumer"
          >
            {{ item.consumer.spec }}
          </button>
          <div v-if="item.consumer.workspace" badge-color-lime px2 rounded text-xs>
            Workspace
          </div>
          <span text-xs op-fade>depth</span>
          <DisplayNumberBadge :number="item.depth" rounded-full text-xs />
        </div>
        <div v-if="data?.authors?.length" flex="~ items-center gap-1 wrap" text-sm op-fade mt2>
          <div i-ph-user-duotone />
          <span>{{ data.authors.map(a => a.name).join(', ') }}</span>
        </div>
        <a
          v-if="repoUrl"
          :href="repoUrl"
          target="_blank"
          rel="noopener"
          text-sm op-fade hover="op100 text-primary"
          flex="~ items-center gap-1" mt1
        >
          <div i-ph-link-simple-duotone />
          <span truncate>{{ repoUrl }}</span>
        </a>
        <div text-xs op-fade mt2 font-mono>
          {{ blockLabel }}["{{ item.depName }}"]
        </div>

        <div border="t base" my4 />

        <div text-xs op-fade uppercase tracking-wider mb2>
          Migration progress
        </div>
        <div flex="~ items-center gap-2" mb1>
          <div flex-auto h-2 bg-active rounded-full of-hidden>
            <div bg-primary h-full :style="{ width: `${ratioPct}%` }" />
          </div>
          <span text-sm font-mono>{{ ratioPct }}%</span>
        </div>
        <div text-xs op-fade>
          {{ item.migratedCount }}/{{ item.totalCount }} consumers of <code font-mono>{{ item.depName }}</code> already declare a range that satisfies <code font-mono>v{{ item.installedHighestVersion }}</code>.
        </div>

        <div text-xs op-fade mt3>
          Installed in workspace:
          <span font-mono>{{ item.installedVersions.map(v => `v${v}`).join(', ') }}</span>
        </div>

        <div border="t base" my4 />

        <div flex="~ items-center gap-2" mb2>
          <div text-xs op-fade uppercase tracking-wider flex-auto>
            Agent prompt
          </div>
          <button
            btn-action as="button" text-sm
            :class="copied ? 'text-green' : ''"
            @click="copy()"
          >
            <div :class="copied ? 'i-ph-check-duotone' : 'i-ph-copy-duotone'" />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <pre
          text-xs p3 rounded-lg border="~ base" bg-glass
          of-x-auto whitespace-pre-wrap font-mono
        >{{ agentPrompt }}</pre>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateX(100%);
}
</style>

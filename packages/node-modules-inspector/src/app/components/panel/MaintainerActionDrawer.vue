<script setup lang="ts">
import type { MaintainerActionItem } from '../../state/maintainer-actions'
import { useClipboard } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { selectedAction } from '../../state/current'
import { getMaintainerActionsFor } from '../../state/maintainer-actions'
import { query } from '../../state/query'
import { buildAgentPrompt, buildAgentPromptAll } from '../../utils/maintainer-action-templates'
import { getPackageData } from '../../utils/package-json'

const item = computed(() => selectedAction.value)

const data = computed(() => item.value ? getPackageData(item.value.consumer) : undefined)
const repoUrl = computed(() => data.value?.repository || data.value?.homepage)

const groupActions = computed<MaintainerActionItem[]>(() =>
  item.value ? getMaintainerActionsFor(item.value.consumer) : [],
)

const viewAll = ref(false)
const canViewAll = computed(() => groupActions.value.length > 1)

watch(() => item.value?.consumer.spec, () => {
  viewAll.value = false
})

const agentPrompt = computed(() => {
  if (!item.value)
    return ''
  if (viewAll.value)
    return buildAgentPromptAll(item.value.consumer, groupActions.value)
  return buildAgentPrompt(item.value)
})
const { copy, copied } = useClipboard({ source: agentPrompt, copiedDuring: 1500 })

const ratioPct = computed(() => item.value ? Math.round(item.value.migrationRatio * 100) : 0)

const blockLabel = computed(() => item.value?.depType === 'peer' ? 'peerDependencies' : 'dependencies')

const open = computed({
  get: () => !!item.value,
  set: (v) => {
    if (!v)
      query.selectedAction = undefined
  },
})

function switchTo(next: MaintainerActionItem) {
  viewAll.value = false
  selectedAction.value = next
}

function showAll() {
  viewAll.value = true
}
</script>

<template>
  <UiDrawer v-model="open" width="w-180">
    <div v-if="item" p6 pb8 flex="~ col gap-0">
      <div text-xs op-fade uppercase tracking-wider flex="~ items-center gap-1" mb3>
        <div i-ph-megaphone-duotone />
        Maintainer Actions
      </div>

      <section flex="~ col gap-2">
        <div flex="~ items-center gap-2 wrap">
          <DisplayPackageSpec :pkg="item.consumer" font-mono text-xl />
          <div v-if="item.consumer.workspace" badge-color-lime px2 rounded text-xs>
            Workspace
          </div>
          <span text-xs op-fade>depth</span>
          <DisplayNumberBadge :number="item.depth" rounded-full text-xs />
        </div>
        <div v-if="data?.authors?.length" flex="~ items-center gap-1 wrap" text-sm op-fade>
          <div i-ph-user-duotone />
          <span>{{ data.authors.map(a => a.name).join(', ') }}</span>
        </div>
        <a
          v-if="repoUrl"
          :href="repoUrl"
          target="_blank"
          rel="noopener"
          text-sm op-fade hover="op100 text-primary"
          flex="~ items-center gap-1"
        >
          <div i-ph-link-simple-duotone />
          <span truncate>{{ repoUrl }}</span>
        </a>
      </section>

      <template v-if="groupActions.length">
        <div border="t base" my5 />

        <div flex="~ items-center gap-2 wrap">
          <button
            v-for="action of groupActions" :key="action.key"
            text-xs px2 py1 rounded-full border font-mono
            flex="~ items-center gap-1"
            :class="!viewAll && action.key === item.key
              ? 'border-primary text-primary bg-primary:10'
              : 'border-base op-fade hover:op100'"
            @click="switchTo(action)"
          >
            {{ action.depName }} <span op-fade>v{{ action.installedHighestVersion }}</span>
          </button>
          <button
            v-if="canViewAll"
            text-xs px2 py1 rounded-full border
            flex="~ items-center gap-1"
            :class="viewAll
              ? 'border-primary text-primary bg-primary:10'
              : 'border-base op-fade hover:op100'"
            :title="`Generate a single agent prompt covering all ${groupActions.length} actions`"
            @click="showAll()"
          >
            <div i-ph-asterisk-duotone />
            All <span op50>({{ groupActions.length }})</span>
          </button>
        </div>
      </template>

      <div border="t base" my5 />

      <section v-if="viewAll">
        <div text-xs op-fade uppercase tracking-wider flex="~ items-center gap-2" mb2>
          <div i-ph-list-bullets-duotone />
          Bulk upgrade
        </div>

        <div border="~ base rounded-md" of-hidden>
          <table w-full text-sm>
            <thead>
              <tr>
                <th text-left op-fade font-normal py1 px2>
                  Dep
                </th>
                <th text-left op-fade font-normal py1 px2>
                  Type
                </th>
                <th text-right op-fade font-normal py1 px2>
                  From
                </th>
                <th text-right op-fade font-normal py1 px2>
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="action of groupActions" :key="action.key"
                border="t base"
                hover:bg-active cursor-pointer
                @click="switchTo(action)"
              >
                <td py1.5 px2 font-mono>
                  {{ action.depName }}
                </td>
                <td py1.5 px2>
                  <span
                    text-xs px1.5 py0.5 rounded font-mono uppercase
                    :class="action.depType === 'peer' ? 'badge-color-purple' : 'badge-color-primary'"
                  >
                    {{ action.depType }}
                  </span>
                </td>
                <td py1.5 px2 text-right font-mono text-xs op80>
                  {{ action.declaredRange }}
                </td>
                <td py1.5 px2 text-right font-mono text-xs>
                  v{{ action.installedHighestVersion }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <template v-else>
        <section>
          <div text-xs op-fade uppercase tracking-wider flex="~ items-center gap-2" mb2>
            <div i-ph-arrow-fat-up-duotone />
            Upgrade
            <span
              px1.5 py0.5 rounded font-mono uppercase text-2xs
              :class="item.depType === 'peer' ? 'badge-color-purple' : 'badge-color-primary'"
            >
              {{ item.depType }}
            </span>
          </div>

          <div font-mono text-3xl mb3>
            {{ item.depName }}
          </div>

          <div flex="~ items-center gap-3 wrap" font-mono>
            <span px2 py1 rounded badge-color-gray text-sm>{{ item.declaredRange }}</span>
            <div i-ph-arrow-right op-mute text-xl />
            <span px2 py1 rounded badge-color-green>v{{ item.installedHighestVersion }}</span>
          </div>

          <div v-if="item.catalogName" text-xs op-fade mt2>
            Resolved from <code font-mono>{{ item.rawRange }}</code> in <code font-mono>pnpm-workspace.yaml</code>.
          </div>

          <div text-xs op-fade mt2 font-mono>
            {{ blockLabel }}["{{ item.depName }}"]
          </div>
        </section>

        <div border="t base" my5 />

        <section>
          <div text-xs op-fade uppercase tracking-wider mb2>
            Migration progress
          </div>
          <div flex="~ items-center gap-3" mb1>
            <UiDonut :value="item.migrationRatio" :size="28" :thickness="5" />
            <div flex-auto>
              <div font-mono text-sm>
                {{ ratioPct }}%
              </div>
              <div text-xs op-fade>
                {{ item.migratedCount }}/{{ item.totalCount }} consumers of <code font-mono>{{ item.depName }}</code> already accept <code font-mono>v{{ item.installedHighestVersion }}</code>.
              </div>
            </div>
          </div>

          <div text-xs op-fade mt3>
            Installed in workspace:
            <span font-mono>{{ item.installedVersions.map(v => `v${v}`).join(', ') }}</span>
          </div>
        </section>
      </template>

      <div border="t base" my5 />

      <section>
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
      </section>
    </div>
  </UiDrawer>
</template>

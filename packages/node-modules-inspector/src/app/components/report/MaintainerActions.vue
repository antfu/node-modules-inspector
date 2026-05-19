<script setup lang="ts">
import type { ParsedAuthor } from 'node-modules-tools/utils'
import type { MaintainerActionGroup, MaintainerActionItem } from '../../state/maintainer-actions'
import { computed, ref } from 'vue'
import { getBackend } from '../../backends'
import { selectedAction, selectedNode } from '../../state/current'
import { fetchPublintMessages, rawPayload, rawPublintMessages } from '../../state/data'
import {
  authorKey,
  filteredMaintainerActionGroups,
  maintainerActionAuthors,
  maintainerActionGroups,
  maintainerActionSortMode,
  maintainerFilter,
  viewAllMaintainerActions,
} from '../../state/maintainer-actions'
import { getNpmMetaLatest, payloads } from '../../state/payload'

const SORT_OPTIONS = ['depth', 'migration', 'latest'] as const
const SORT_TITLES = ['Depth', 'Migration rate', 'Latest released']

const backend = getBackend()

const publintRunning = ref(false)
const publintDone = ref(0)
const publintTotal = ref(0)

const pendingPublintCandidates = computed(() =>
  payloads.filtered.packages.filter(p =>
    !p.workspace
    && !p.private
    && p.filepath
    && !p.resolved.publint
    && !rawPublintMessages.value.has(p.spec),
  ),
)

async function runPublintForAll() {
  if (publintRunning.value)
    return
  const candidates = pendingPublintCandidates.value
  if (!candidates.length)
    return
  publintRunning.value = true
  publintDone.value = 0
  publintTotal.value = candidates.length
  try {
    await Promise.all(candidates.map(async (pkg) => {
      await fetchPublintMessages(pkg)
      publintDone.value++
    }))
  }
  finally {
    publintRunning.value = false
  }
}

function selectItem(item: MaintainerActionItem) {
  viewAllMaintainerActions.value = false
  selectedAction.value = item
}

function openGroupAll(group: MaintainerActionGroup) {
  const first = group.items[0]
  if (!first)
    return
  selectedNode.value = group.consumer
  selectedAction.value = first
  viewAllMaintainerActions.value = true
}

function toggleAuthor(author: ParsedAuthor) {
  const key = authorKey(author)
  const i = maintainerFilter.value.indexOf(key)
  if (i === -1)
    maintainerFilter.value = [...maintainerFilter.value, key]
  else
    maintainerFilter.value = maintainerFilter.value.filter(a => a !== key)
}

function clearFilter() {
  maintainerFilter.value = []
}

function ratioPct(migrationRatio: number) {
  return Math.round(migrationRatio * 100)
}
</script>

<template>
  <div>
    <template v-if="maintainerActionGroups.length">
      <UiSubTitle>
        Maintainer Actions
        <DisplayNumberBadge :number="maintainerActionGroups.length" rounded-full text-sm />
      </UiSubTitle>

      <div op-fade>
        Packages with actionable improvements for maintainers, including out-of-range dependency declarations and publint findings.
      </div>

      <div v-if="backend.isDynamic && rawPayload?.config?.publint && (pendingPublintCandidates.length || publintRunning)" mt3>
        <button
          btn-action
          :disabled="publintRunning"
          @click="runPublintForAll()"
        >
          <div :class="publintRunning ? 'i-ph-spinner-gap-duotone animate-spin' : 'i-ph-book-open-duotone'" />
          {{ publintRunning ? `Running publint... (${publintDone}/${publintTotal})` : 'Run Publint for all packages' }}
        </button>
      </div>

      <div v-if="maintainerActionAuthors.length" mb2 border="~ base rounded-md" flex="~ col gap-3" p3 mt4>
        <div text-xs flex="~ items-center gap-1" h-5 px1>
          <div i-ph-user-duotone />
          Maintainers
          <button v-if="maintainerFilter.length" border="~ base rounded-full" px2 py1 text-xs op-fade flex="~ items-center gap-1" hover:op100 ml-2 @click="clearFilter()">
            <div i-ph-funnel-x-duotone />
            Clear Filter
          </button>
          <div ml-auto flex="~ items-center gap-1">
            <span op-fade mr1>Sort by</span>
            <OptionSelectGroup
              v-model="maintainerActionSortMode"
              :options="SORT_OPTIONS"
              :titles="SORT_TITLES"
            />
          </div>
        </div>
        <div flex="~ wrap gap-2 items-center">
          <button
            v-for="author of maintainerActionAuthors"
            :key="authorKey(author)"
            rounded-full
            :class="
              maintainerFilter.length === 0
                ? ''
                : maintainerFilter.includes(authorKey(author))
                  ? 'ring-2 ring-primary'
                  : 'op-fade hover:op100'"
            @click="toggleAuthor(author)"
          >
            <DisplayAuthorEntry :author="author" :link="false" :size="22" />
          </button>
        </div>
      </div>
      <div v-else mb2 border="~ base rounded-md" flex="~ items-center gap-1" px3 py2 mt4 text-xs>
        <span op-fade mr1>Sort by</span>
        <OptionSelectGroup
          v-model="maintainerActionSortMode"
          :options="SORT_OPTIONS"
          :titles="SORT_TITLES"
        />
      </div>

      <template v-if="filteredMaintainerActionGroups.length">
        <div
          class="grid items-center"
          style="grid-template-columns: auto auto minmax(1rem, 1fr) auto auto auto minmax(1rem, 1fr) auto auto auto;"
        >
          <template v-for="group of filteredMaintainerActionGroups" :key="group.consumer.spec">
            <div col-span-10 h-5 />
            <div
              col-span-10
              flex="~ items-center gap-3 wrap"
              px3 py2
              border="~ base rounded-t-md"
            >
              <button
                font-mono hover:text-primary
                flex="~ items-center gap-2"
                :title="`Open all actions for ${group.consumer.spec}`"
                @click="openGroupAll(group)"
              >
                <DisplayPackageSpec :pkg="group.consumer" />
              </button>
              <DisplayVersionWithUpdates
                :version="group.consumer.version"
                :latest="getNpmMetaLatest(group.consumer)"
                :display-version="false"
              />
              <DisplayDateBadge :pkg="group.consumer" />
              <DisplayAuthors v-if="group.authors.length" :authors="group.authors" :size="20" />
              <div ml-auto flex="~ items-center gap-2">
                <DisplayNumberBadge :number="group.items.length" rounded-full text-xs />
                <span text-xs op-fade>{{ group.items.length === 1 ? 'action' : 'actions' }}</span>
              </div>
            </div>
            <template v-for="(item, idx) of group.items" :key="item.key">
              <button
                v-if="item.kind === 'dep-upgrade'"
                border="x base"
                class="col-span-10 grid grid-cols-subgrid items-center text-left border-b border-base hover:bg-active px3 py2 gap-x-2"
                :class="[selectedAction?.key === item.key ? 'bg-primary:10' : '', idx === group.items.length - 1 ? 'rounded-b-md' : '']"
                @click="selectItem(item)"
              >
                <PanelMaintainerActionTypePill :action="item" />
                <span font-mono text-sm op80 truncate>{{ item.depName }}</span>
                <span />
                <div flex items-center justify-end>
                  <span font-mono text-xs px1 rounded badge-color-gray max-w-30 text-ellipsis of-hidden ws-nowrap>{{ item.declaredRange }}</span>
                </div>
                <div i-ph-arrow-right op-mute flex-none text-xs />
                <div flex items-center justify-start>
                  <span font-mono text-sm px1 rounded badge-color-green max-w-30 text-ellipsis of-hidden ws-nowrap>v{{ item.installedHighestVersion }}</span>
                </div>
                <span />
                <UiDonut
                  v-tooltip="`${item.migratedCount}/${item.totalCount} consumers satisfy ${item.depName}@${item.installedHighestVersion}`"
                  :value="item.migrationRatio"
                  :size="16"
                  :thickness="3"
                />
                <span text-xs op-fade font-mono text-right>{{ ratioPct(item.migrationRatio) }}%</span>
                <div i-ph-caret-right op-fade flex-none />
              </button>
              <button
                v-else
                border="x base"
                class="col-span-10 flex items-center gap-3 text-left border-b border-base hover:bg-active px3 py2"
                :class="[selectedAction?.key === item.key ? 'bg-primary:10' : '', idx === group.items.length - 1 ? 'rounded-b-md' : '']"
                @click="selectItem(item)"
              >
                <PanelMaintainerActionTypePill :action="item" />
                <IntegrationsPublintCounts :messages="item.messages" />
                <div flex-auto />
                <div i-ph-caret-right op-fade flex-none />
              </button>
            </template>
          </template>
        </div>
      </template>
      <UiEmptyState
        v-else
        type="info"
        title="No Matches"
        message="No packages match the selected maintainer filter."
      />
    </template>
    <UiEmptyState
      v-else
      type="checkmark"
      title="No Maintainer Actions"
      message="No out-of-range declarations or publint findings in this workspace."
    />
  </div>
</template>

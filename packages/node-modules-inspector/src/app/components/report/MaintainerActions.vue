<script setup lang="ts">
import type { ParsedAuthor } from 'node-modules-tools/utils'
import type { MaintainerActionGroup, MaintainerActionItem } from '../../state/maintainer-actions'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { computed, ref } from 'vue'
import { getBackend } from '../../backends'
import { selectedAction, selectedNode } from '../../state/current'
import { fetchPublintMessages, rawPayload, rawPublintMessages } from '../../state/data'
import {
  authorKey,
  filteredMaintainerActionGroups,
  maintainerActionAuthors,
  maintainerActionGroups,
  maintainerActionIncludePublint,
  maintainerActionLatestOnly,
  maintainerActionSortMode,
  maintainerFilter,
  viewAllMaintainerActions,
} from '../../state/maintainer-actions'
import { payloads } from '../../state/payload'

const SORT_OPTIONS = ['depth', 'migration', 'latest'] as const
const SORT_TITLES = ['Depth', 'Migration rate', 'Latest released']

const backend = getBackend()

const publintRunning = ref(false)
const publintDone = ref(0)
const publintTotal = ref(0)

const breakpoints = useBreakpoints(breakpointsTailwind)
const isTwoColumns = breakpoints.greaterOrEqual('2xl')

const MAINTAINERS_COLLAPSED_COUNT = 15
const showAllMaintainers = ref(false)
const visibleMaintainers = computed(() => {
  const all = maintainerActionAuthors.value
  if (showAllMaintainers.value || all.length <= MAINTAINERS_COLLAPSED_COUNT)
    return all
  return all.slice(0, MAINTAINERS_COLLAPSED_COUNT)
})

const groupColumns = computed<MaintainerActionGroup[][]>(() => {
  const groups = filteredMaintainerActionGroups.value
  if (!isTwoColumns.value)
    return [groups]
  const left: MaintainerActionGroup[] = []
  const right: MaintainerActionGroup[] = []
  groups.forEach((g, i) => {
    (i % 2 === 0 ? left : right).push(g)
  })
  return [left, right]
})

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

      <div v-if="maintainerActionAuthors.length" mb2 border="~ base rounded-md" bg-base flex="~ col gap-3" p3 mt4>
        <div text-xs flex="~ items-center gap-1" h-5 px1>
          <div i-ph-user-duotone />
          Maintainers
          <button v-if="maintainerFilter.length" border="~ base rounded-full" px2 py1 text-xs op-fade flex="~ items-center gap-1" hover:op100 ml-2 @click="clearFilter()">
            <div i-ph-funnel-x-duotone />
            Clear Filter
          </button>
        </div>
        <div flex="~ wrap gap-2 items-center">
          <button
            v-for="entry of visibleMaintainers"
            :key="authorKey(entry.author)"
            rounded-full
            :class="
              maintainerFilter.length === 0
                ? ''
                : maintainerFilter.includes(authorKey(entry.author))
                  ? 'ring-2 ring-primary'
                  : 'op-fade hover:op100'"
            :title="`${entry.count} ${entry.count === 1 ? 'package' : 'packages'}`"
            @click="toggleAuthor(entry.author)"
          >
            <DisplayAuthorEntry :author="entry.author" :link="false" :size="22" class="pr-0!">
              <template #after>
                <DisplayNumberBadge :number="entry.count" rounded-full text-xs px2 />
              </template>
            </DisplayAuthorEntry>
          </button>
          <button
            v-if="maintainerActionAuthors.length > MAINTAINERS_COLLAPSED_COUNT"
            border="~ base rounded-full" px2 py1 text-xs op-fade flex="~ items-center gap-1" hover:op100
            @click="showAllMaintainers = !showAllMaintainers"
          >
            <div :class="showAllMaintainers ? 'i-ph-caret-up-duotone' : 'i-ph-caret-down-duotone'" />
            {{ showAllMaintainers
              ? 'Show less'
              : `Show ${maintainerActionAuthors.length - MAINTAINERS_COLLAPSED_COUNT} more` }}
          </button>
        </div>
      </div>

      <div mt4 mb2 flex="~ wrap items-center gap-x-4 gap-y-2" text-xs px1>
        <div flex="~ items-center gap-1">
          <span op-fade mr1>Sort by</span>
          <OptionSelectGroup
            v-model="maintainerActionSortMode"
            :options="SORT_OPTIONS"
            :titles="SORT_TITLES"
          />
        </div>
        <label flex="~ items-center gap-2" cursor-pointer>
          <OptionCheckbox v-model="maintainerActionLatestOnly" />
          Show only packages with latest major
        </label>
        <label flex="~ items-center gap-2" cursor-pointer>
          <OptionCheckbox v-model="maintainerActionIncludePublint" />
          Include publint findings
        </label>
        <div v-if="backend.isDynamic && rawPayload?.config?.publint && maintainerActionIncludePublint && (pendingPublintCandidates.length || publintRunning)">
          <button
            btn-action
            :disabled="publintRunning"
            @click="runPublintForAll()"
          >
            <div :class="publintRunning ? 'i-ph-spinner-gap-duotone animate-spin' : 'i-ph-book-open-duotone'" />
            {{ publintRunning ? `Running publint... (${publintDone}/${publintTotal})` : 'Run publint for all packages' }}
          </button>
        </div>
      </div>

      <template v-if="filteredMaintainerActionGroups.length">
        <div flex="~ gap-3 items-start" mt3>
          <ReportMaintainerActionsGrid
            v-for="(col, i) of groupColumns"
            :key="i"
            :groups="col"
            flex-1 min-w-0
            @select-item="selectItem"
            @open-group-all="openGroupAll"
          />
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

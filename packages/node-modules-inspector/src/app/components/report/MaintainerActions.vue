<script setup lang="ts">
import type { MaintainerActionGroup, MaintainerActionItem } from '../../state/maintainer-actions'
import { selectedAction } from '../../state/current'
import {
  filteredMaintainerActionGroups,
  maintainerActionAuthors,
  maintainerActionGroups,
  maintainerFilter,
  viewAllMaintainerActions,
} from '../../state/maintainer-actions'

function selectItem(item: MaintainerActionItem) {
  viewAllMaintainerActions.value = false
  selectedAction.value = item
}

function openGroupAll(group: MaintainerActionGroup) {
  const first = group.items[0]
  if (!first)
    return
  selectedAction.value = first
  viewAllMaintainerActions.value = true
}

function toggleAuthor(author: string) {
  const i = maintainerFilter.value.indexOf(author)
  if (i === -1)
    maintainerFilter.value = [...maintainerFilter.value, author]
  else
    maintainerFilter.value = maintainerFilter.value.filter(a => a !== author)
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

      <div badge-color-amber flex="~ gap-2 items-center" rounded-lg p2 mb3 px3>
        <div i-ph-pipe-wrench-duotone flex-none />
        <span>
          Packages with actionable improvements for maintainers, including out-of-range dependency declarations and publint findings.
        </span>
      </div>

      <div v-if="maintainerActionAuthors.length" mb2 border="~ base rounded-md" flex="~ col gap-3" p3>
        <div text-xs op-fade flex="~ items-center gap-1" h-5 px1>
          <div i-ph-user-duotone />
          Maintainers
          <button v-if="maintainerFilter.length" border rounded-full px2 py1 text-xs op-fade flex="~ items-center gap-1" hover:op100 ml-2 @click="clearFilter()">
            <div i-ph-funnel-x-duotone />
            Clear Filter
          </button>
        </div>
        <div flex="~ wrap gap-2 items-center">
          <button
            v-for="author of maintainerActionAuthors"
            :key="author"
            text-xs px2 py0.5 rounded-full border
            :class="maintainerFilter.includes(author)
              ? 'border-primary text-primary bg-primary:10'
              : 'border-base op-fade hover:op100'"
            @click="toggleAuthor(author)"
          >
            {{ author }}
          </button>
        </div>
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
              <div v-if="group.consumer.workspace" badge-color-lime px2 rounded text-xs>
                Workspace
              </div>
              <div v-if="group.authors.length" flex="~ items-center gap-1" text-xs op-fade>
                <div i-ph-user-duotone />
                <span>{{ group.authors.join(', ') }}</span>
              </div>
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

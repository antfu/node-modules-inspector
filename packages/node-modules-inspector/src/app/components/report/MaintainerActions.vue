<script setup lang="ts">
import type { MaintainerActionItem } from '../../state/maintainer-actions'
import { selectedAction, selectedNode } from '../../state/current'
import {
  filteredMaintainerActionGroups,
  maintainerActionAuthors,
  maintainerActionGroups,
  maintainerFilter,
} from '../../state/maintainer-actions'

function selectItem(item: MaintainerActionItem) {
  selectedAction.value = item
}

function selectConsumer(item: MaintainerActionItem['consumer']) {
  selectedNode.value = item
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

function ratioPct(item: MaintainerActionItem) {
  return Math.round(item.migrationRatio * 100)
}
</script>

<template>
  <div>
    <template v-if="maintainerActionGroups.length">
      <UiSubTitle>
        Out-of-range Declarations
        <DisplayNumberBadge :number="maintainerActionGroups.length" rounded-full text-sm />
      </UiSubTitle>

      <div badge-color-amber flex="~ gap-2 items-center" rounded-lg p2 mb3 px3>
        <div i-ph-megaphone-duotone flex-none />
        <span>
          Packages whose declared dependency range excludes a newer stable version installed elsewhere in this workspace.
          Sorted by depth, then by how much of the workspace has already moved on.
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
                :title="`Show ${group.consumer.spec} in side panel`"
                @click="selectConsumer(group.consumer)"
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
            <button
              v-for="(item, idx) of group.items" :key="item.key"
              border="x base"
              class="col-span-10 grid grid-cols-subgrid items-center text-left border-b border-base hover:bg-active px3 py2 gap-x-2"
              :class="[selectedAction?.key === item.key ? 'bg-primary:10' : '', idx === group.items.length - 1 ? 'rounded-b-md' : '']"
              @click="selectItem(item)"
            >
              <span
                text-xs px1.5 py0.5 rounded font-mono uppercase
                :class="item.depType === 'peer' ? 'badge-color-purple' : 'badge-color-primary'"
              >
                {{ item.depType }}
              </span>
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
              <span text-xs op-fade font-mono text-right>{{ ratioPct(item) }}%</span>
              <div i-ph-caret-right op-fade flex-none />
            </button>
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
      title="No Out-of-range Declarations"
      message="All packages declare ranges that include the latest stable installed versions in this workspace."
    />
  </div>
</template>

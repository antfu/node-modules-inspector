<script setup lang="ts">
import type { MaintainerActionGroup, MaintainerActionItem } from '../../state/maintainer-actions'
import { selectedAction } from '../../state/current'
import { getNpmMetaLatest } from '../../state/payload'

defineProps<{
  groups: MaintainerActionGroup[]
}>()

const emit = defineEmits<{
  selectItem: [item: MaintainerActionItem]
  openGroupAll: [group: MaintainerActionGroup]
}>()

function ratioPct(migrationRatio: number) {
  return Math.round(migrationRatio * 100)
}
</script>

<template>
  <div
    class="grid items-center self-start"
    style="grid-template-columns: auto auto minmax(1rem, 1fr) auto auto auto minmax(1rem, 1fr) auto auto auto;"
  >
    <template v-for="(group, gIdx) of groups" :key="group.consumer.spec">
      <div v-if="gIdx > 0" col-span-10 h-3 />
      <div
        col-span-10
        flex="~ items-center gap-3 wrap"
        px3 py2 bg-base
        border="~ base rounded-t-md"
      >
        <button
          font-mono hover:text-primary
          flex="~ items-center gap-2"
          :title="`Open all actions for ${group.consumer.spec}`"
          @click="emit('openGroupAll', group)"
        >
          <DisplayPackageSpec :pkg="group.consumer" />
        </button>
        <DisplayVersionWithUpdates
          :version="group.consumer.version"
          :latest="getNpmMetaLatest(group.consumer)"
          :display-version="false"
        />
        <DisplayDateBadge :pkg="group.consumer" rounded-full />
        <DisplayAuthors v-if="group.authors.length" :authors="group.authors" :size="20" />
      </div>
      <template v-for="(item, idx) of group.items" :key="item.key">
        <button
          v-if="item.kind === 'dep-upgrade'"
          border="x base"
          class="col-span-10 grid grid-cols-subgrid items-center text-left border-b border-base hover:bg-active px3 py2 gap-x-2"
          :class="[selectedAction?.key === item.key ? 'bg-primary:10' : '', idx === group.items.length - 1 ? 'rounded-b-md' : '']"
          @click="emit('selectItem', item)"
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
          @click="emit('selectItem', item)"
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

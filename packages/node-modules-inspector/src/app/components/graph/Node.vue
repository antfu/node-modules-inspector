<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { HighlightMode } from '~/state/highlight'
import { selectedNode } from '~/state/current'
import { settings } from '~/state/settings'

defineProps<{
  pkg: PackageNode
  highlightMode?: HighlightMode
}>()
</script>

<template>
  <UiPackageBorder
    :pkg
    as="button"
    outer="graph-node"
    inner="graph-node-button"
    :fade="true"
    :highlight-mode="highlightMode"
    @click="selectedNode = pkg === selectedNode ? null : pkg"
  >
    <DisplayPackageSpec :pkg flex-auto justify-start text-left />
    <DisplayModuleType text-xs justify-end ml2 :pkg :badge="false" />
    <DisplayFileSizeBadge
      v-if="settings.showInstallSizeBadge"
      :precent="false"
      :bytes="pkg.resolved.installSize?.bytes" :digits="0" rounded-r-full text-sm mr--2
    />
  </UiPackageBorder>
</template>

<style>
.graph-node {
  --uno: absolute bg-base border rounded-xl font-mono ws-nowrap;
  transform: translate(-50%, -50%);
}

.graph-node-button {
  --uno: 'flex items-center rounded-xl w-full px2 hover:bg-active gap-1';
}
</style>

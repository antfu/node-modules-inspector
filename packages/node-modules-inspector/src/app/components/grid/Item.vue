<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import { settings } from '../../state/settings'

defineProps<{
  pkg: PackageNode
}>()
</script>

<template>
  <UiPackageBorder
    :pkg
    as="button"
    outer="border rounded-lg"
    inner="flex flex-col gap-2 justify-center h-full hover:bg-active p2 px3"
    @click="selectedNode = pkg === selectedNode ? undefined : pkg"
  >
    <DisplayPackageSpec :pkg text-left />
    <div flex="~ wrap gap-2 items-center" text-sm>
      <DisplayModuleType :pkg />
      <DisplayNumberBadge
        v-if="payloads.available.flatDependents(pkg).length"
        :number="payloads.available.flatDependents(pkg).length"
        icon="i-ph-arrow-elbow-down-right-duotone text-xs"
        rounded-full text-sm
      />
      <DisplayNumberBadge
        v-if="payloads.available.flatDependencies(pkg).length"
        :number="payloads.available.flatDependencies(pkg).length"
        icon="i-ph-lego-duotone text-xs"
        rounded-full text-sm
      />

      <DisplayFileSizeBadge
        v-if="settings.showInstallSizeBadge && pkg.resolved.installSize?.bytes"
        :bytes="pkg.resolved.installSize.bytes"
        :digits="0"
        rounded-full text-sm
      />

      <DisplayDateBadge
        v-if="settings.showPublishTimeBadge"
        :pkg
        rounded-full text-sm
      />

      <DisplaySourceTypeBadge :pkg />

      <!--
      <span op-mute>·</span>
      <div op75>
        {{ pkg.resolved.license }}
      </div> -->
      <!-- <template v-if="pkg.resolved.author">
        <span op-mute>·</span>
        <div op75>
          {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
        </div>
      </template> -->
    </div>
  </UiPackageBorder>
</template>

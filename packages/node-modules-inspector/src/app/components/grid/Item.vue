<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { getPublishTime, payloads } from '~/state/payload'
import { settings } from '~/state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const publishedAt = computed(() => getPublishTime(props.pkg))
</script>

<template>
  <UiPackageBorder
    :pkg
    as="button"
    outer="border rounded-lg"
    inner="flex flex-col gap-2 hover:bg-active p2 px3"
    @click="selectedNode = pkg === selectedNode ? null : pkg"
  >
    <DisplayPackageSpec :pkg text-left />
    <div flex="~ wrap gap-2 items-center" text-sm>
      <DisplayModuleType :pkg />
      <DisplayNumberBadge
        v-if="payloads.avaliable.flatDependents(pkg).length"
        :number="pkg.flatDependents.size"
        icon="i-ph-arrow-elbow-down-right-duotone text-xs"
        rounded-full text-sm
      />
      <DisplayNumberBadge
        v-if="payloads.avaliable.flatDependencies(pkg).length"
        :number="payloads.avaliable.flatDependencies(pkg).length"
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
        v-if="settings.showPublishTimeBadge && publishedAt"
        :date="publishedAt"
        rounded-full text-sm
      />

      <!--
      <span op25>·</span>
      <div op75>
        {{ pkg.resolved.license }}
      </div> -->
      <!-- <template v-if="pkg.resolved.author">
        <span op25>·</span>
        <div op75>
          {{ pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
        </div>
      </template> -->
    </div>
  </UiPackageBorder>
</template>

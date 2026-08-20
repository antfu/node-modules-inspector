<script setup lang="ts">
import type { MaintainerActionItem } from '../../state/maintainer-actions'
import DisplayBadge from '@antfu/design/components/Display/DisplayBadge.vue'

defineProps<{
  action: MaintainerActionItem
}>()
</script>

<template>
  <DisplayBadge
    v-if="action.kind === 'dep-upgrade'"
    :text="action.depType"
    :color="action.depType === 'peer' ? 'purple' : 'primary'"
    class="font-mono uppercase text-xs"
  />
  <DisplayBadge v-else text="publint" color="teal" class="font-mono uppercase text-xs" />
</template>

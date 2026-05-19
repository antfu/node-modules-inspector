<script setup lang="ts">
import type { MaintainerActionItem } from '../../state/maintainer-actions'

defineProps<{
  action: MaintainerActionItem
}>()
</script>

<template>
  <span
    v-if="action.kind === 'dep-upgrade'"
    text-xs px1.5 py0.5 rounded font-mono uppercase
    :class="action.depType === 'peer' ? 'badge-color-purple' : 'badge-color-primary'"
  >
    {{ action.depType }}
  </span>
  <span
    v-else
    text-xs px1.5 py0.5 rounded font-mono uppercase badge-color-teal
    flex="~ items-center gap-1"
  >
    publint
  </span>
</template>

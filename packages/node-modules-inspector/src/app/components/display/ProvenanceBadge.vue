<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Tooltip } from 'floating-vue'
import { computed } from 'vue'
import { getNpmMeta } from '../../state/payload'
import { settings } from '../../state/settings'

const props = defineProps<{
  pkg: PackageNode
  class?: string
}>()

const meta = computed(() => getNpmMeta(props.pkg))
</script>

<template>
  <template v-if="settings.showProvenanceBadge === 'present'">
    <Tooltip v-if="meta?.provenance" inline-flex :class="props.class">
      <div i-ph:circle-wavy-check-duotone ma h-1.1em text-primary-400 />
      <template #popper>
        This package is built and signed
        {{ meta.provenance === 'trustedPublisher' ? 'by trusted publisher' : 'with provenance' }}
      </template>
    </Tooltip>
  </template>
  <template v-else-if="settings.showProvenanceBadge === 'absent'">
    <Tooltip v-if="meta && !meta.provenance" inline-flex :class="props.class">
      <div i-ph:circle-wavy-warning-duotone ma h-1.1em text-amber-400 />
      <template #popper>
        This package is not signed with provenance
      </template>
    </Tooltip>
  </template>
</template>

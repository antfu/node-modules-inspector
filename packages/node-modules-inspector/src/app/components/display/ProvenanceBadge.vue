<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Tooltip } from 'floating-vue'
import { computed } from 'vue'
import { getNpmMeta } from '../../state/payload'
import { settings } from '../../state/settings'

const props = defineProps<{
  pkg: PackageNode
}>()

const meta = computed(() => getNpmMeta(props.pkg))
</script>

<template>
  <template v-if="settings.showProvenanceBadge === 'present'">
    <Tooltip v-if="meta?.provenance" inline-block align-middle>
      <div i-ph:circle-wavy-check-duotone inline-block align-middle text-primary-400 text-sm />
      <template #popper>
        This package is built and signed
        {{ meta.provenance === 'trustedPublisher' ? 'by trusted publisher' : 'with provenance' }}
      </template>
    </Tooltip>
  </template>
  <template v-else-if="settings.showProvenanceBadge === 'absent'">
    <Tooltip v-if="meta && !meta.provenance" inline-block align-middle>
      <div i-ph:circle-wavy-warning-duotone inline-block align-middle text-amber-400 text-sm />
      <template #popper>
        This package is not signed with provenance
      </template>
    </Tooltip>
  </template>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Tooltip } from 'floating-vue'
import { computed } from 'vue'
import { getNpmMeta } from '../../state/payload'

const props = defineProps<{
  pkg: PackageNode
}>()
const meta = computed(() => getNpmMeta(props.pkg))
</script>

<template>
  <Tooltip v-if="meta?.provenance">
    <div i-ph:circle-wavy-check-duotone text-primary-400 text-sm />
    <template #popper>
      This package is built and signed
      {{ meta.provenance === 'trustedPublisher' ? 'by trusted publisher' : 'with provenance' }}
    </template>
  </Tooltip>
</template>

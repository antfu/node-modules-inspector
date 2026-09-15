<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getNpmMeta } from '../../state/payload'
import { settings } from '../../state/settings'

const props = defineProps<{
  pkg: PackageNode
  class?: string
}>()

const meta = computed(() => getNpmMeta(props.pkg))

const isShown = computed(() => {
  if (settings.value.showProvenanceBadge === 'present') {
    return !!meta.value?.provenance
  }
  if (settings.value.showProvenanceBadge === 'absent') {
    return meta.value && !meta.value.provenance
  }
  return false
})

const title = computed(() => {
  if (meta.value?.provenance) {
    return `This package is built and signed ${meta.value.provenance === 'trustedPublisher' ? 'by trusted publisher' : 'with provenance'}`
  }
  return 'This package is not signed with provenance'
})

const icon = computed(() => {
  if (meta.value?.provenance) {
    return meta.value.provenance === 'trustedPublisher'
      ? 'i-ph:circle-wavy-check-duotone text-green-400'
      : 'i-ph:circle-wavy-check-duotone text-primary-400'
  }
  return 'i-ph:circle-wavy-warning-duotone text-amber-400'
})
</script>

<template>
  <span
    v-if="isShown" v-tooltip="title"
    :class="[props.class, icon]"
    h-1.1em inline-flex align-middle
  />
</template>

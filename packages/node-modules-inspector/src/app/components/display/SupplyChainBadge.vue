<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getNpmMeta } from '../../state/payload'
import { settings } from '../../state/settings'
import { getSupplyChainScore } from '../../utils/supply-chain'

const props = defineProps<{
  pkg: PackageNode
  class?: string
}>()

const meta = computed(() => getNpmMeta(props.pkg))

/**
 * How many of the three supply-chain signals (provenance, trusted publisher,
 * staged publish) this package has. `undefined` when there is no npm meta yet.
 */
const score = computed(() => meta.value ? getSupplyChainScore(meta.value) : undefined)

const isShown = computed(() => {
  if (score.value === undefined)
    return false
  if (settings.value.showSupplyChainBadge === 'present')
    return score.value > 0
  if (settings.value.showSupplyChainBadge === 'absent')
    return score.value === 0
  return false
})

const TRUSTED_PUBLISHER = 'by a trusted publisher'
const description = computed(() => {
  const m = meta.value
  const state = m?.provenance
    ? `signed with provenance${m.trustedPublisher ? ` ${TRUSTED_PUBLISHER}` : ''}`
    : m?.trustedPublisher
      ? `published ${TRUSTED_PUBLISHER}`
      : 'not signed with provenance'
  return `This package is ${state}${m?.staged ? ' (staged publish)' : ''}`
})

const icon = computed(() => {
  switch (score.value) {
    case 3:
      return 'i-ph:seal-check-duotone text-green-400'
    case 2:
      return 'i-ph:circle-wavy-check-duotone text-teal-400'
    case 1:
      return 'i-ph:circle-wavy-check-duotone text-blue-400'
    default:
      return 'i-ph:circle-wavy-warning-duotone text-amber-400'
  }
})
</script>

<template>
  <span
    v-if="isShown" v-tooltip="description"
    :class="[props.class, icon]"
    h-1.1em inline-flex align-middle
  />
</template>

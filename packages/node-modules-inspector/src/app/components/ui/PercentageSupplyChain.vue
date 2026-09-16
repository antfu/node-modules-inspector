<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { SUPPLY_CHAIN_SIGNALS } from 'node-modules-tools/utils'
import { computed } from 'vue'
import { getNpmMeta, payloads } from '../../state/payload'
import { getSupplyChainScore } from '../../utils/supply-chain'
import UiPercentage from './Percentage.vue'

const props = withDefaults(
  defineProps<{
    pkg?: PackageNode
    packages?: PackageNode[]
    flat?: boolean
    rounded?: boolean
  }>(),
  {
    flat: false,
    rounded: true,
  },
)

// Same green/teal/blue/gray ramp as the badge, best first.
const SCORE_COLORS = ['badge-color-gray', 'badge-color-blue', 'badge-color-teal', 'badge-color-green']

const nodes = computed(() => {
  const pkgs = props.pkg
    ? [
        props.pkg,
        ...props.flat
          ? payloads.available.flatDependencies(props.pkg)
          : payloads.available.dependencies(props.pkg),
      ]
    : props.packages ?? []

  const scores = pkgs.map(p => getSupplyChainScore(getNpmMeta(p)))

  return SCORE_COLORS
    .map((className, score) => {
      const value = scores.filter(s => s === score).length
      return {
        value,
        name: `${score}/${SUPPLY_CHAIN_SIGNALS.length}`,
        class: className,
        title: `${value} dependencies with ${score} of ${SUPPLY_CHAIN_SIGNALS.length} supply chain signals: ${SUPPLY_CHAIN_SIGNALS.join(', ')}`,
      }
    })
    .reverse()
    .filter(n => n.value > 0)
})
</script>

<template>
  <UiPercentage :nodes :rounded />
</template>

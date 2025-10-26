<script setup lang="ts">
import { payloads } from '../../state/payload'
</script>

<template>
  <div border="t base">
    <div flex="~ gap-2 items-center" p4 pb0>
      <div i-ph-chart-bar-duotone flex-none />
      Filter Results
    </div>
    <div p3 flex="~ col gap-2 ">
      <div flex="~ items-center gap-2">
        <DisplayNumberBadge :number="payloads.filtered.packages.length" rounded-full color="badge-color-primary" />
        <span op-fade>of</span>
        <DisplayNumberBadge :number="payloads.available.packages.length" rounded-full />
        <span op-fade>packages filtered</span>
      </div>
      <div v-if="payloads.excluded.packages.length" flex="~ items-center gap-1" text-0.85rem>
        <span op-mute>(</span>
        <DisplayNumberBadge :number="payloads.excluded.packages.length" rounded-full />
        <span op-fade>packages excluded</span>
        <span op-mute>)</span>
      </div>
    </div>
    <UiPercentageModuleType :packages="payloads.filtered.packages" :rounded="false" />
  </div>
</template>

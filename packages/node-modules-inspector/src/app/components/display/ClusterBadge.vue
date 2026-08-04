<script setup lang="ts">
import { Tooltip } from 'floating-vue'
import { computed } from 'vue'
import { getHashColorFromString } from '../../utils/color'

const props = defineProps<{
  cluster: string
}>()

const parsed = computed(() => {
  const parts = props.cluster.split(':')
  if (parts.length === 1) {
    return {
      namespace: null,
      value: props.cluster,
    }
  }
  return {
    namespace: parts[0],
    value: parts.slice(1).join(':'),
  }
})

const color = computed(() => getHashColorFromString(props.cluster))

const style = computed(() => ({
  color: color.value,
  borderColor: getHashColorFromString(props.cluster, 0.2),
  backgroundColor: getHashColorFromString(props.cluster, 0.1),
}))
</script>

<template>
  <Tooltip>
    <div flex="~ gap-1 items-center" text-sm pl1 pr2 rounded border-l-3 border :style>
      <!-- Intentionally full-opacity: `op-fade` (65% light / 55% dark) dilutes
           the already contrast-tuned hash color further toward the badge's own
           background, dragging worst-case hues under 4.5:1 (axe-core-measured,
           e.g. ~6.9:1 undiluted down to ~3.5:1). Same class of bug as
           `Percentage.vue`'s percentage span. -->
      <div v-if="parsed.namespace" text-xs>
        {{ parsed.namespace }}:
      </div>
      <div rounded-full font-mono>
        {{ parsed.value }}
      </div>
    </div>
    <template #popper>
      <div>
        <div v-if="parsed.namespace === 'catalog'">
          Introduced by packages marked as <code :style="{ color }">{{ parsed.value }}</code> catalog in pnpm-workspace.yaml
        </div>
        <div v-else>
          This package is in the <code :style="{ color }">{{ cluster }}</code> cluster
        </div>
      </div>
    </template>
  </Tooltip>
</template>

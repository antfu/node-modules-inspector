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
      <div v-if="parsed.namespace" text-xs op-fade>
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

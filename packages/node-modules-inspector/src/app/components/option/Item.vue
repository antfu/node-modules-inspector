<script setup lang="ts">
import { Tooltip as VTooltip } from 'floating-vue'

defineProps<{
  title: string
  div?: boolean
  description?: string
}>()

const emit = defineEmits<{
  (event: 'reset'): void
}>()

function reset() {
  emit('reset')
}
</script>

<template>
  <component :is="div ? 'div' : 'label'" flex="~ row gap-2 items-center" select-none>
    <div w-50 flex="~ gap-1 items-center">
      <VTooltip placement="left" distance="10">
        <div op75 text-sm @dblclick="reset">
          {{ title }}
        </div>
        <template #popper>
          <div text-sm>
            {{ description }}
          </div>
        </template>
      </VTooltip>
    </div>
    <slot />
  </component>
</template>

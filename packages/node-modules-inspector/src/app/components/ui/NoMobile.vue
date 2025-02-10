<script setup lang="ts">
import { useSessionStorage, useWindowSize } from '@vueuse/core'
import { computed } from 'vue'

const size = useWindowSize()
const isMobile = computed(() => size.width.value < 768)
const override = useSessionStorage('node-modules-inspector-no-mobile-override', false)
const shouldShow = computed(() => isMobile.value && !override.value)
</script>

<template>
  <div
    v-if="shouldShow"
    fixed inset-0 top-0 bottom-0 left-0 right-0 bg-glass z-panel-no-mobile
    flex="~ col gap-2 items-center justify-center"
  >
    <div class="text-2xl">
      Mobile is Not Supported
    </div>
    <div text-center op75>
      The layout is not optimized for mobile devices.<br>
      Please use a desktop browser or wider screen.
    </div>
    <div border="t base" p4 flex="~ gap-2 items-center" mt-5>
      <button btn-action @click="override = true">
        <div i-ph-door-open-duotone />
        Let me use it Anyway
      </button>
    </div>
  </div>
</template>

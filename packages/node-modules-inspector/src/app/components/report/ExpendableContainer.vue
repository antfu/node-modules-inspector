<script setup lang="ts" generic="T">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    list: T[]
    mutliplier?: number
  }>(),
  {
    mutliplier: 1.5,
  },
)

const count = defineModel('count', {
  default: 15,
})

const top = computed(() => props.list.slice(0, count.value))
</script>

<template>
  <div flex flex-col gap2 border="~ rounded-xl base" p4 bg-glass of-auto relative>
    <slot :items="top" />

    <div v-if="list.length > count" pointer-events-none absolute left-0 right-0 bottom-0 bg-gradient-more h-30 flex="~ items-center justify-center" p2>
      <button
        flex gap1 items-center self-end op50 hover:bg-active hover:op100 py2 rounded-full
        pointer-events-auto pl20 pr22
        @click="count = Math.round(count * 1.5)"
      >
        <div class="i-ri:arrow-down-double-line" />
        More
      </button>
    </div>
  </div>
</template>

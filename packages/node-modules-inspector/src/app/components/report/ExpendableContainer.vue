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
  <div relative of-hidden border="~ rounded-xl base" bg-glass>
    <div flex flex-col gap2 p4 of-auto relative>
      <slot :items="top" />
    </div>
    <div
      v-if="list.length > count"
      pointer-events-none absolute left-0 right-0 bottom-0 bg-gradient-more h-30 mb4
      flex="~ col"
    >
      <button
        op35 p2 pt4 w-full mta
        pointer-events-auto
        hover:op100
        flex="~ items-center gap-1 justify-center"
        @click="count = Math.round(count * 1.5)"
      >
        <div class="i-ri:arrow-down-double-line" />
        More
      </button>
    </div>
  </div>
</template>

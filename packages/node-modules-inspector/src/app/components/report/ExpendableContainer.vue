<script setup lang="ts" generic="T">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    list: T[]
    title?: string | [string, string]
    reversable?: boolean
    mutliplier?: number
  }>(),
  {
    reversable: true,
    mutliplier: 1.5,
  },
)

const count = defineModel('count', {
  default: 15,
})

const reverse = defineModel('reverse', {
  default: false,
})

const resolvedTitle = computed(() => Array.isArray(props.title) ? reverse.value ? props.title[1] : props.title[0] : props.title)

function toReversed<T>(arr: T[]): T[] {
  if ('toReversed' in arr) {
    return arr.toReversed()
  }
  else {
    // @ts-expect-error any
    return arr.slice().reverse()
  }
}

const top = computed(() => {
  const list = props.list
  return (reverse.value ? toReversed(list) : list).slice(0, count.value)
})
</script>

<template>
  <div>
    <UiSubTitle v-if="title">
      {{ resolvedTitle }}
      <DisplayNumberBadge :number="list.length" rounded-full text-sm />
      <button
        v-if="reversable"
        title="Reverse"
        ml-a w-8 h-8 rounded-full hover:bg-active flex
        @click="reverse = !reverse"
      >
        <div v-if="!reverse" i-ph-sort-descending ma />
        <div v-else i-ph-sort-ascending ma />
      </button>
    </UiSubTitle>
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
  </div>
</template>

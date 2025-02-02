<script setup lang="ts">
defineProps<{
  options: readonly (string | number | null)[]
  titles?: string[]
  classes?: string[]
}>()

const value = defineModel<string | number | null>('modelValue', {
  type: [String, Number],
})
</script>

<template>
  <fieldset flex="~ inline wrap" border="~ base rounded" of-hidden text-xs>
    <label
      v-for="i, idx of options"
      :key="i ?? idx"
      border="b base" relative mb--1px hover:bg-hover px-2 py-1
      :class="[
        idx ? 'border-l border-base ml--1px' : '',
        i === value ? 'bg-active' : '',
      ]"
      :title="titles?.[idx]"
    >
      <div
        :class="[
          i === value ? '' : 'op35',
          titles?.[idx] ? '' : 'capitalize',
          classes?.[idx] || '',
        ]"
      >{{ titles?.[idx] ?? i }}</div>
      <input
        v-model="value" type="radio" :value="i"
        :title="titles?.[idx]"
        absolute inset-0 op-0.1
      >
    </label>
  </fieldset>
</template>

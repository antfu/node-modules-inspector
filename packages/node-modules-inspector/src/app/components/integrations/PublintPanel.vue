<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'

const props = defineProps<{
  pkg: PackageNode
}>()

const counter = computed(() => {
  const values = {
    error: 0,
    warning: 0,
    suggestion: 0,
  }
  for (const message of props.pkg.resolved.publint || []) {
    values[message.type]++
  }
  return values
})
</script>

<template>
  <component
    :is="props.pkg.resolved.publint.length > 0 ? 'a' : 'div'"
    v-if="props.pkg.resolved.publint"
    :href="`https://publint.dev/${props.pkg.spec}`"
    target="_blank"
    :class="props.pkg.resolved.publint.length > 0 ? 'hover:bg-active' : ''"
    block
  >
    <div flex="~ gap-2 items-center">
      <span op50 text-sm>publint</span>
      <template v-if="counter.error">
        <DisplayNumberBadge :number="counter.error" rounded-full text-sm color="badge-color-red">
          <template #after>
            <span text-xs ml1 op50>error{{ counter.error > 1 ? 's' : '' }}</span>
          </template>
        </DisplayNumberBadge>
      </template>
      <template v-if="counter.warning">
        <DisplayNumberBadge :number="counter.warning" rounded-full text-sm color="badge-color-amber">
          <template #after>
            <span text-xs ml1 op50>warning{{ counter.warning > 1 ? 's' : '' }}</span>
          </template>
        </DisplayNumberBadge>
      </template>
      <template v-if="counter.suggestion">
        <DisplayNumberBadge :number="counter.suggestion" rounded-full text-sm color="badge-color-blue">
          <template #after>
            <span text-xs ml1 op50>suggestion{{ counter.suggestion > 1 ? 's' : '' }}</span>
          </template>
        </DisplayNumberBadge>
      </template>
      <template v-if="!props.pkg.resolved.publint.length">
        <div badge-color-green rounded-full text-sm py0.5 px2 flex="~ items-center gap-1">
          <div i-ph-checks-bold />
          <span text-green6 dark:text-green text-xs>All Good</span>
        </div>
      </template>
    </div>
    <!-- Publint does not provide a way for browser to render the message, we leave it here for now -->
    <!-- <div>
      <div v-for="message of props.pkg.resolved.publint" :key="message.code">
        <span>{{ formatMessage(message) }}</span>
      </div>
    </div> -->
  </component>
</template>

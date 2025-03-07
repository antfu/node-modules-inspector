<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { Message as PublintMessage } from 'publint'
import { computed } from 'vue'
import { settings } from '~/state/settings'
import { formatMessage } from '~/utils/publint'

const props = defineProps<{
  pkg: PackageNode
  messages: PublintMessage[] | undefined | null
}>()

const counter = computed(() => {
  const values = {
    error: 0,
    warning: 0,
    suggestion: 0,
  }
  for (const message of props.messages || []) {
    values[message.type]++
  }
  return values
})

const icons = {
  error: 'i-ph-x-duotone text-red',
  warning: 'i-ph-warning-duotone text-amber',
  suggestion: 'i-ph-info-duotone text-blue',
}

const messageColors = {
  error: 'dark:text-red2:75 text-red8:75',
  warning: 'dark:text-amber2:75 text-amber8:75',
  suggestion: 'dark:text-blue2:75 text-blue8:75',
}
</script>

<template>
  <div v-if="messages" block>
    <button flex="~ gap-2 items-center" w-full p4 select-none @click="settings.showPublintMessages = !settings.showPublintMessages">
      <span op50 text-sm>publint</span>
      <template v-if="!messages.length">
        <div badge-color-green rounded-full text-sm py0.5 px2 flex="~ items-center gap-1">
          <div i-ph-checks-bold />
          <span text-green6 dark:text-green text-xs>All Good</span>
        </div>
      </template>
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
      <div flex-auto />
      <button
        v-if="messages.length"
        p1 rounded-full hover:bg-active mr--2
        title="Toggle file composition"
      >
        <div i-ph-caret-down transition duration-300 :class="settings.showPublintMessages ? 'op75' : 'rotate-90 op25'" />
      </button>
    </button>
    <a
      v-if="settings.showPublintMessages && messages.length"
      flex="~ col gap-2"
      p3 mt--2 of-x-auto w-full
      :href="`https://publint.dev/${props.pkg.spec}`"
      target="_blank"
      :class="messages.length > 0 ? 'hover:bg-active' : ''"
    >
      <div v-for="message of messages" :key="message.code" text-sm flex="~ gap-2">
        <div :class="icons[message.type]" flex-none mt0.5 />
        <div
          rounded line-clamp-3 break-all
          :class="messageColors[message.type]"
          v-html="formatMessage(message, { ...props.pkg, ...props.pkg.resolved })"
        />
      </div>
    </a>
  </div>
</template>

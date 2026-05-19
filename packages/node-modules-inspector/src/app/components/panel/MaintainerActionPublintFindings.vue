<script setup lang="ts">
import type { PublintAction } from '../../state/maintainer-actions'
import { formatMessage } from 'publint/utils'

const props = withDefaults(
  defineProps<{
    action: PublintAction
    showLink?: boolean
  }>(),
  {
    showLink: false,
  },
)

function severityIcon(type: 'error' | 'warning' | 'suggestion') {
  if (type === 'error')
    return 'i-ph-x-circle-duotone text-red'
  if (type === 'warning')
    return 'i-ph-warning-duotone text-amber'
  return 'i-ph-info-duotone text-blue'
}

function messageHtml(msg: PublintAction['messages'][number]) {
  return formatMessage(msg, props.action.consumer.resolved.packageJson, { color: 'html' }) ?? msg.code
}
</script>

<template>
  <section>
    <div text-xs op-fade uppercase tracking-wider flex="~ items-center gap-2" mb2>
      <div i-ph-book-open-duotone />
      publint findings
      <span op-fade font-normal>({{ action.messages.length }})</span>
    </div>
    <ul flex="~ col gap-2">
      <li
        v-for="(msg, i) of action.messages" :key="i"
        flex="~ items-start gap-2" text-sm
      >
        <div :class="severityIcon(msg.type)" mt0.5 flex-none />
        <div>
          <span op-fade text-xs font-mono mr1>{{ msg.code }}</span>
          <span v-html="messageHtml(msg)" />
        </div>
      </li>
    </ul>
    <a
      v-if="showLink"
      :href="`https://publint.dev/${action.consumer.spec}`"
      target="_blank"
      rel="noopener"
      text-xs op-fade hover:op100 mt3 inline-block
    >
      Open on publint.dev →
    </a>
  </section>
</template>

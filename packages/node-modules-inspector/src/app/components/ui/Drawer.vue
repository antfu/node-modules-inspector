<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    width?: string
    closeOnBackdrop?: boolean
    closeOnEscape?: boolean
  }>(),
  {
    width: 'w-180',
    closeOnBackdrop: true,
    closeOnEscape: true,
  },
)

const open = defineModel<boolean>({ required: true })

function close() {
  open.value = false
}

function onBackdropClick() {
  if (props.closeOnBackdrop)
    close()
}

onKeyStroke('Escape', () => {
  if (open.value && props.closeOnEscape)
    close()
})
</script>

<template>
  <Transition name="drawer-backdrop">
    <div
      v-if="open"
      fixed inset-0 z-drawer-backdrop bg-black:30
      @click="onBackdropClick"
    />
  </Transition>
  <Transition name="drawer-panel">
    <div
      v-if="open"
      fixed right-0 top-0 bottom-0 z-drawer-content
      max-w-90vw bg-base
      border="l base" shadow-2xl
      flex="~ col" of-hidden
      :class="width"
    >
      <button
        absolute top-2 right-2 z-1
        w-10 h-10 rounded-full op30
        hover="op100 bg-active"
        flex="~ items-center justify-center"
        title="Close"
        @click="close"
      >
        <div i-ph-x />
      </button>
      <div of-y-auto flex-auto>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateX(100%);
}
</style>

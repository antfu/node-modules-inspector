<script setup lang="ts">
import { ref, watch } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const { content, hideInterval = 1500 } = defineProps<{
  content: string
  hideInterval?: number
}>()

const isVisible = ref(false)

let timeoutId: ReturnType<typeof setTimeout> | null = null

watch(() => content, () => {
  if (timeoutId)
    clearTimeout(timeoutId)

  isVisible.value = true

  timeoutId = setTimeout(() => {
    isVisible.value = false
  }, hideInterval)
})
</script>

<template>
  <transition
    enter-active-class="transition-opacity duration-200 ease-in"
    leave-active-class="transition-opacity duration-500 ease-out"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="isVisible" v-bind="$attrs">
      {{ content }}
    </div>
  </transition>
</template>

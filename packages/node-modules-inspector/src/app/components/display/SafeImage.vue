<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  src?: string
}>()

const status = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')

function load() {
  if (!props.src) {
    status.value = 'idle'
    return
  }
  status.value = 'loading'
  const img = new Image()
  img.src = props.src
  img.onload = () => {
    if (img.src === props.src)
      status.value = 'ok'
  }
  img.onerror = () => {
    if (img.src === props.src)
      status.value = 'error'
  }
}

onMounted(load)
watch(() => props.src, load)
</script>

<template>
  <img
    v-if="status === 'ok'"
    v-bind="$attrs"
    :src="props.src"
    @error="status = 'error'"
  >
  <slot v-else name="fallback" />
</template>

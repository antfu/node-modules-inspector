<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  src: string
}>()

const success = ref(false)

onMounted(() => {
  const img = new Image()
  img.src = props.src
  img.onload = () => {
    success.value = true
  }
})
</script>

<template>
  <img
    v-if="success"
    :src="props.src"
    @error="success = false"
  >
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  src: string
}>()

const success = ref(true)
</script>

<template>
  <img
    v-if="success"
    :src="props.src"
    @error="success = false"
  >
</template>

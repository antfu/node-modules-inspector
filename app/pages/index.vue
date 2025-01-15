<script setup lang="ts">
import { payload } from '~/composables/payload'
</script>

<template>
  <div>
    Hello {{ payload }}
    <slot />
  </div>
</template>

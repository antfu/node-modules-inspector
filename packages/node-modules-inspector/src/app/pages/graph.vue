<script setup lang="ts">
import { payload } from '~/state/payload'
</script>

<template>
  <GraphCanvas :payload="payload.filtered" />
</template>

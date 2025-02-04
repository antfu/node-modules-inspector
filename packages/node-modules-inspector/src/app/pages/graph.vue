<script setup lang="ts">
import { payloads } from '~/state/payload'
</script>

<template>
  <GraphCanvas :payload="payloads.filtered" />
</template>

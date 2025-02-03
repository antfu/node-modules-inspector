<script setup lang="ts">
import { payload } from '~/state/payload'
</script>

<template>
  <GraphCanvas :packages="payload.filtered.packages" />
</template>

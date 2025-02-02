<script setup lang="ts">
import { filteredPackages } from '~/state/filters'
</script>

<template>
  <GraphCanvas :packages="filteredPackages" />
</template>

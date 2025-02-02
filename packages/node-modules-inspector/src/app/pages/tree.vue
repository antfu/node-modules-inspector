<script setup lang="ts">
import { filteredPackages } from '~/state/search'
</script>

<template>
  <TreeGraph :packages="filteredPackages" />
</template>

<script setup lang="ts">
import { filteredPackages } from '~/state/filters'
</script>

<template>
  <PackagesGraph :packages="filteredPackages" />
</template>

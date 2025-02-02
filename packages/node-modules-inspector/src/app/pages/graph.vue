<script setup lang="ts">
import { filteredPackages } from '~/state/filters'
</script>

<template>
  <PackageGraph :packages="filteredPackages" />
</template>

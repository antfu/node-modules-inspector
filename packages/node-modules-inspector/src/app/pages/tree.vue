<script setup lang="ts">
import { filteredPackages } from '~/state/search'
</script>

<template>
  <div w-screen h-screen of-scroll flex="~ items-center justify-center">
    <TreeGraph :packages="filteredPackages" />
  </div>
</template>

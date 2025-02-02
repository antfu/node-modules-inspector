<script setup lang="ts">
import { filteredPackages } from '~/state/filters'
</script>

<template>
  <CanvasContainer grid="~ cols-minmax-400px gap-2">
    <PackageInfoGrid
      v-for="pkg of filteredPackages"
      :key="pkg.spec"
      :pkg="pkg"
    />
  </CanvasContainer>
</template>

<script setup lang="ts">
import { filteredPackages } from '~/state/filters'
</script>

<template>
  <div grid="~ cols-minmax-400px gap-2" pt-22 pl-120 pr-10>
    <PackageInfoGrid
      v-for="pkg of filteredPackages"
      :key="pkg.spec"
      :pkg="pkg"
    />
  </div>
</template>

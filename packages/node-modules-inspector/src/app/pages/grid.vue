<script setup lang="ts">
import { filteredPackages } from '~/state/search'
</script>

<template>
  <div grid="~ cols-minmax-400px gap-2" pt-14 pl-100>
    <PackageInfoGrid
      v-for="pkg of filteredPackages"
      :key="pkg.spec"
      :pkg="pkg"
    />
  </div>
</template>

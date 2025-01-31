<script setup lang="ts">
import { packageData } from '~/state/data'
</script>

<template>
  <div grid="~ cols-minmax-400px gap-2" pt-14 pl-100>
    <PackageInfoGrid
      v-for="pkg of packageData?.packages || []"
      :key="pkg.name"
      :pkg="pkg"
    />
  </div>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'

defineProps<{
  packages: PackageNode[]
}>()
</script>

<template>
  <div grid="~ cols-minmax-320px gap-2">
    <GridItem
      v-for="pkg of packages"
      :key="pkg.spec"
      :pkg="pkg"
    />
  </div>
</template>

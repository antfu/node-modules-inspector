<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { rpc } from '../composables/rpc'

const { state } = useAsyncState(() => rpc.listDependencies(), null)
</script>

<template>
  <div>
    <NavPanel />
    <SearchPanel />
    <TreeGraph v-if="state" :data="state" />
    <div grid="~ cols-minmax-400px gap-2">
      <PackageItem
        v-for="pkg of state?.packages || []"
        :key="pkg.name"
        :pkg="pkg"
      />
    </div>
  </div>
</template>

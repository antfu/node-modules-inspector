<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { rpc } from '../composables/rpc'

const data = useAsyncState(() => rpc.listDependencies(), null)
</script>

<template>
  <div>
    Hello {{ data }}
    <slot />
  </div>
</template>

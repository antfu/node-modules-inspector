<script setup lang="ts">
import { packageData } from '~/state/data'
</script>

<template>
  <div w-screen h-screen of-scroll flex="~ items-center justify-center">
    <div>Not yet implemented</div>
    <TreeGraph v-if="packageData" :data="packageData" />
  </div>
</template>

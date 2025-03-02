<script setup lang="ts">
import { useRoute, useRouter } from '#app/composables/router'

const router = useRouter()
const route = useRoute()
router.replace({ path: '/grid', hash: location.hash, query: route.query })
</script>

<template>
  <div>
    Redirecting...
  </div>
</template>

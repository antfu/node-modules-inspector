<script setup lang="ts">
import type { ListPackageDependenciesResult } from 'node-modules-tools'
import { hierarchy } from 'd3-hierarchy'
import { onMounted, useTemplateRef } from 'vue'

const props = defineProps<{
  data: ListPackageDependenciesResult
}>()

const el = useTemplateRef<HTMLDivElement>('el')

onMounted(() => {
  const { data } = props
  const _root = hierarchy({
    name: 'root',
    children: data.packages.map(pkg => ({
      name: pkg.name,
      value: 1,
    })),
  })
})
</script>

<template>
  <div ref="el" />
</template>

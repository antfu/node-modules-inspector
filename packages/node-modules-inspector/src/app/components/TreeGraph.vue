<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'
import { hierarchy } from 'd3-hierarchy'
import { onMounted, useTemplateRef } from 'vue'

const props = defineProps<{
  packages: ResolvedPackageNode[]
}>()

const el = useTemplateRef<HTMLDivElement>('el')

onMounted(() => {
  const _root = hierarchy({
    name: 'root',
    children: props.packages.map(pkg => ({
      name: pkg.name,
      value: 1,
    })),
  })
})
</script>

<template>
  <div ref="el" />
</template>

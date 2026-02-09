<script setup lang="ts">
import type { GraphBase, GraphBaseOptions } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import { useTemplateRef, watchEffect } from 'vue'

const props = defineProps<{
  graph: GraphBase<PackageNode | undefined, GraphBaseOptions<PackageNode | undefined>>
}>()

const el = useTemplateRef<HTMLDivElement>('el')

watchEffect(() => el.value?.append(props.graph.el))
</script>

<template>
  <div ref="el" />
</template>

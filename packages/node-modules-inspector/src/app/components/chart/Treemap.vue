<script setup lang="ts">
import type { GraphBase } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import type { ChartNode } from '../../types/chart'
import { useTemplateRef, watchEffect } from 'vue'

const props = defineProps<{
  graph: GraphBase<PackageNode | undefined>
  selected?: ChartNode | undefined
}>()

const emit = defineEmits<{
  (e: 'select', node: ChartNode | null): void
}>()

const el = useTemplateRef<HTMLDivElement>('el')
watchEffect(() => el.value?.append(props.graph.el))
</script>

<template>
  <div>
    <ChartNavBreadcrumb
      border="b base" py2 min-h-10
      :selected="selected"
      :options="graph.options"
      @select="emit('select', $event)"
    />
    <div ref="el" />
  </div>
</template>

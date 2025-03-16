<script setup lang="ts">
import type { GraphBase, GraphBaseOptions } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import type { ChartNode } from '../../types/chart'
import { useTemplateRef, watchEffect } from 'vue'

const props = defineProps<{
  graph: GraphBase<PackageNode | undefined, GraphBaseOptions<PackageNode | undefined>>
  selected: ChartNode | undefined
}>()

const emit = defineEmits<{
  (e: 'select', node: ChartNode | null): void
}>()

const el = useTemplateRef<HTMLDivElement>('el')
watchEffect(() => el.value?.append(props.graph.el))
</script>

<template>
  <div grid="~ cols-[500px_1fr]">
    <div ref="el" />
    <ChartSunburstSide
      :options="graph.options"
      :selected="selected"
      @select="x => emit('select', x)"
    />
  </div>
</template>

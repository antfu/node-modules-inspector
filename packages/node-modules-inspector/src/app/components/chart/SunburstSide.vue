<script setup lang="ts">
import type { GraphBaseOptions } from 'nanovis'
import type { PackageNode } from 'node-modules-tools'
import type { ChartNode } from '../../types/chart'
import { colorToCssBackground } from 'nanovis'
import { computed } from 'vue'

const props = defineProps<{
  selected?: ChartNode
  options: GraphBaseOptions<PackageNode | undefined>
}>()

const emit = defineEmits<{
  (e: 'select', node: ChartNode | null): void
}>()

const parentStack = computed(() => {
  const stack: ChartNode[] = []
  let current = props.selected
  while (current) {
    stack.unshift(current)
    current = current.parent
  }
  return stack
})
</script>

<template>
  <div flex="~ col gap-4">
    <div flex="~ gap-2 items-center wrap" border="b base" py2>
      <template v-for="node, idx of parentStack" :key="node.id">
        <div v-if="idx > 0" i-ph-arrow-right-bold text-sm op50 />
        <button
          hover="bg-active" rounded px2
          @click="emit('select', node)"
        >
          <DisplayPackageSpec v-if="node.meta" :pkg="node.meta" />
          <span v-else>{{ node.id }}</span>
        </button>
      </template>
    </div>
    <div v-if="selected" grid="~ cols-[250px_1fr] gap-1">
      <template v-for="child of selected.children" :key="child.id">
        <button
          ws-nowrap text-nowrap text-left overflow-hidden text-ellipsis text-sm
          hover="bg-active" rounded px2
          @click="emit('select', child)"
        >
          <span v-if="child.meta && child.meta === selected?.meta" text-primary>(self)</span>
          <DisplayPackageSpec v-else-if="child.meta" :pkg="child.meta" />
          <span v-else>{{ child.id }}</span>
        </button>

        <button
          relative flex="~ gap-1 items-center"
          hover="bg-active" rounded
          @click="emit('select', child)"
        >
          <div
            h-5 rounded shadow border="~ base"
            :style="{
              background: colorToCssBackground(options.getColor?.(child) || '#000'),
              width: `${child.size / selected.size * 100}%`,
            }"
          />
          <DisplayFileSizeBadge text-xs :bytes="child.size" :percent="false" />
          <div
            v-if="child.children.length > 0"
            v-tooltip="`${child.children.length} dependencies`"
            :title="`${child.children.length} dependencies`"
            text-xs op50
          >
            ({{ child.children.length }})
          </div>
        </button>
      </template>
    </div>
  </div>
</template>

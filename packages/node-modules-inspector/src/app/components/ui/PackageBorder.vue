<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { HighlightMode } from '~/state/highlight'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'
import { getCompareHighlight } from '~/state/highlight'
import { payloads } from '~/state/payload'

const props = withDefaults(
  defineProps<{
    pkg: PackageNode
    outer?: string
    inner?: string
    as?: string
    fade?: boolean
    borderBase?: string
    highlightMode?: HighlightMode
  }>(),
  {
    selectionMode: 'none',
    as: 'div',
    fade: false,
    borderBase: 'border-base',
    highlightMode: 'focus',
  },
)

const isSelected = computed(() => selectedNode.value === props.pkg)
const isRelated = computed(() => {
  if (!selectedNode.value)
    return false
  return isSelected.value || payloads.avaliable.flatDependents(selectedNode.value).includes(props.pkg) || payloads.avaliable.flatDependencies(selectedNode.value).includes(props.pkg)
})
const isFaded = computed(() => selectedNode.value && !isRelated.value)
const isFocused = computed(() => {
  if (!props.pkg)
    return false
  return filters.state.focus?.includes(props.pkg.spec) || filters.state.why?.includes(props.pkg.spec)
})

const highlightCompare = computed(() => {
  if (props.highlightMode !== 'compare')
    return 'none'
  return getCompareHighlight(props.pkg)
})

const classesOuter = computed(() => {
  const list: string[] = []

  if (isRelated.value)
    list.push('z-graph-node-active')
  else
    list.push('z-graph-node')

  if (isFocused.value)
    list.push('border-teal:50')
  else if (isSelected.value)
    list.push('border-primary')
  else if (isRelated.value)
    list.push('border-primary:50')
  else if (highlightCompare.value === 'none')
    list.push(props.borderBase)

  if (highlightCompare.value === 'both')
    list.push('border-pink5:50')
  else if (highlightCompare.value === 'a')
    list.push('border-yellow5:50')
  else if (highlightCompare.value === 'b')
    list.push('border-purple5:50')

  if (isSelected.value) {
    if (isFocused.value)
      list.push('ring-3 ring-teal:25! text-teal-600 dark:text-teal-300 border-teal!')
    else
      list.push('ring-3 ring-primary:25! text-primary-600 dark:text-primary-300')
  }

  if (props.pkg?.private)
    list.push('border-dashed!')

  return list
})

const classesInner = computed(() => {
  const list: string[] = []

  if (isFocused.value)
    list.push('bg-teal:10!')
  else if (isSelected.value)
    list.push('bg-primary:10!')
  else if (highlightCompare.value === 'both')
    list.push('bg-pink5:10')
  else if (highlightCompare.value === 'a')
    list.push('bg-yellow5:10')
  else if (highlightCompare.value === 'b')
    list.push('bg-purple5:10')

  if (isFaded.value && props.fade)
    list.push('op75')

  return list
})
</script>

<template>
  <Component :is="as" :class="[classesOuter, outer]" bg-base>
    <div :class="[classesInner, inner]">
      <slot />
    </div>
  </Component>
</template>

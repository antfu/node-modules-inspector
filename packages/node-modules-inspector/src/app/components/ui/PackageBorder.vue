<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { filters } from '~/state/filters'
import { payloads } from '~/state/payload'

const props = withDefaults(
  defineProps<{
    pkg: PackageNode
    outer?: string
    inner?: string
    as?: string
    fade?: boolean
  }>(),
  {
    selectionMode: 'none',
    as: 'div',
    fade: false,
  },
)

const isSelected = computed(() => selectedNode.value === props.pkg)
const isRelated = computed(() => {
  if (!selectedNode.value)
    return false
  return isSelected.value || payloads.avaliable.flatDependents(selectedNode.value).includes(props.pkg) || payloads.avaliable.flatDependencies(props.pkg).includes(selectedNode.value)
})
const isFaded = computed(() => selectedNode.value && !isRelated.value)

const isFocused = computed(() => {
  if (!props.pkg)
    return false
  return filters.focus?.includes(props.pkg.spec) || filters.why?.includes(props.pkg.spec)
})

const classesOuter = computed(() => {
  const list: string[] = []

  if (isRelated.value)
    list.push('z-graph-node-active')
  else
    list.push('z-graph-node')

  if (isFocused.value)
    list.push('border-orange:50')
  else if (isSelected.value)
    list.push('border-primary')
  else if (isRelated.value)
    list.push('border-primary:50')
  else
    list.push('border-base')

  if (isSelected.value) {
    if (isFocused.value)
      list.push('ring-3 ring-yellow:25! text-orange-600 dark:text-orange-300 border-orange!')
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
    list.push('bg-orange:10!')
  else if (isSelected.value)
    list.push('bg-primary:10!')

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

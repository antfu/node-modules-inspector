<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { payloads } from '~/state/payload'

const props = withDefaults(
  defineProps<{
    pkg?: PackageNode
    packages?: PackageNode[]
    flat?: boolean
    rounded?: boolean
  }>(),
  {
    flat: false,
    rounded: true,
  },
)

const nodes = computed(() => {
  const pkgs = props.pkg
    ? [
        props.pkg,
        ...props.flat
          ? payloads.avaliable.flatDependencies(props.pkg)
          : payloads.avaliable.dependencies(props.pkg),
      ]
    : props.packages ?? []

  const depthCounts = pkgs.reduce((acc, pkg) => {
    acc[pkg.depth] = (acc[pkg.depth] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return Object.entries(depthCounts)
    .map(([depth, count]) => ({
      value: count,
      name: `DEPTH${depth}`,
      class: 'badge-color-primary',
      title: `${count} dependencies are in depth ${depth}`,
    }))
    .sort((a, b) => Number(a.name.split(' ')[1]) - Number(b.name.split(' ')[1]))
})
</script>

<template>
  <UiPercentage :nodes :rounded />
</template>

<script setup lang="ts">
import type { PackageModuleType, PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { payloads } from '../../state/payload'
import { getModuleTypeCounts, MODULE_TYPES_COLOR_BADGE } from '../../utils/module-type'

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

  return (Object.entries(getModuleTypeCounts(pkgs)) as [PackageModuleType, number][])
    .filter(([_, c]) => c > 0)
    .map(([type, c]) => ({
      value: c,
      name: type.toUpperCase(),
      class: MODULE_TYPES_COLOR_BADGE[type],
      title: `${c} dependencies are in ${type.toUpperCase()}`,
    }))
})
</script>

<template>
  <UiPercentage :nodes :rounded />
</template>

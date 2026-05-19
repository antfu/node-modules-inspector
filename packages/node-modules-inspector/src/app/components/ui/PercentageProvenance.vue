<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getNpmMeta, payloads } from '../../state/payload'

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
          ? payloads.available.flatDependencies(props.pkg)
          : payloads.available.dependencies(props.pkg),
      ]
    : props.packages ?? []

  let signed = 0
  let unsigned = 0
  for (const p of pkgs) {
    if (getNpmMeta(p)?.provenance)
      signed++
    else
      unsigned++
  }

  return [
    { value: signed, name: 'SIGNED', class: 'badge-color-green', title: `${signed} dependencies signed with provenance` },
    { value: unsigned, name: 'UNSIGNED', class: 'badge-color-gray', title: `${unsigned} dependencies not signed with provenance` },
  ].filter(n => n.value > 0)
})
</script>

<template>
  <UiPercentage :nodes :rounded />
</template>

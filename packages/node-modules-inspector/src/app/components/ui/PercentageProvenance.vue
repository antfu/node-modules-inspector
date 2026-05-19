<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getNpmMeta, payloads } from '../../state/payload'

const props = withDefaults(
  defineProps<{
    pkg: PackageNode
    flat?: boolean
  }>(),
  {
    flat: false,
  },
)

const counts = computed(() => {
  const deps = props.flat
    ? payloads.available.flatDependencies(props.pkg)
    : payloads.available.dependencies(props.pkg)

  let withProvenance = 0
  let withoutProvenance = 0
  for (const dep of deps) {
    if (getNpmMeta(dep)?.provenance)
      withProvenance++
    else
      withoutProvenance++
  }
  return {
    withProvenance,
    withoutProvenance,
    total: deps.length,
  }
})

const nodes = computed(() => [
  {
    value: counts.value.withProvenance,
    name: 'With provenance',
    class: 'text-primary-400',
    title: `${counts.value.withProvenance} dependencies signed with provenance`,
  },
  {
    value: counts.value.withoutProvenance,
    name: 'Without provenance',
    class: 'text-amber-400',
    title: `${counts.value.withoutProvenance} dependencies not signed with provenance`,
  },
])

const percentage = computed(() => {
  if (counts.value.total === 0)
    return 0
  return +(counts.value.withProvenance * 100 / counts.value.total).toFixed(1)
})
</script>

<template>
  <div v-if="counts.total > 0" flex="~ gap-4 items-center">
    <UiDonutSegments :nodes :size="72" :thickness="10">
      <div flex="~ col items-center" leading-none>
        <div font-mono text-base>
          {{ percentage }}%
        </div>
      </div>
    </UiDonutSegments>
    <div flex="~ col gap-1" text-sm>
      <div flex="~ items-center gap-2">
        <div w-2 h-2 rounded-full bg-primary-400 />
        <span op75>With provenance</span>
        <span font-mono>{{ counts.withProvenance }}</span>
      </div>
      <div flex="~ items-center gap-2">
        <div w-2 h-2 rounded-full bg-amber-400 />
        <span op75>Without provenance</span>
        <span font-mono>{{ counts.withoutProvenance }}</span>
      </div>
    </div>
  </div>
</template>

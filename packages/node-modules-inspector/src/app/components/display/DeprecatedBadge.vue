<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Tooltip } from 'floating-vue'
import { computed } from 'vue'
import { getDeprecatedInfo } from '~/state/payload'

const props = defineProps<{
  pkg: PackageNode
}>()

const deprecation = computed(() => getDeprecatedInfo(props.pkg))

const labelMap = {
  package: 'Deprecated',
  current: 'Version Deprecated',
  future: 'Going to be deprecated',
}
</script>

<template>
  <Tooltip v-if="deprecation">
    <div
      flex="~ gap-1 items-center"
      text-sm px1 py0.5 rounded
      badge-color-red
    >
      <div i-ph-warning-circle-duotone flex-none />
      <div rounded-full font-mono>
        {{ labelMap[deprecation.type] }}
      </div>
    </div>
    <template #popper>
      <div>
        {{ deprecation.latest || deprecation.current }}
      </div>
    </template>
  </Tooltip>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { Tooltip } from 'floating-vue'
import { computed } from 'vue'

const props = defineProps<{
  pkg: PackageNode
}>()

const isVersionDeprecated = computed(() => props.pkg.resolved.deprecatedInfo?.current?.deprecated || false)

const isPackageDeprecated = computed(() => props.pkg.resolved.deprecatedInfo?.last?.deprecated || false)

const isDeprecated = computed(() => isVersionDeprecated.value || isPackageDeprecated.value)

const label = computed(() => {
  return isPackageDeprecated.value ? 'Package Deprecated' : 'Version Deprecated'
})

const tooltipMessage = computed(() => {
  if (isPackageDeprecated.value)
    return props.pkg.resolved.deprecatedInfo?.last?.deprecated
  if (isVersionDeprecated.value)
    return props.pkg.resolved.deprecatedInfo?.current?.deprecated

  return isPackageDeprecated.value
    ? 'The package is deprecated. Consider finding an alternative.'
    : 'The current version of this package is deprecated.'
})
</script>

<template>
  <Tooltip v-if="isDeprecated">
    <div
      flex="~ gap-1 items-center"
      text-sm pl1 pr2 rounded
      border-l-3 border
      text-red-500
      style="border-color: rgba(239, 68, 68, 0.2); background-color: rgba(239, 68, 68, 0.1);"
    >
      <div i-ph-warning-circle-duotone flex-none />
      <div rounded-full font-mono>
        {{ label }}
      </div>
    </div>
    <template #popper>
      <div>
        {{ tooltipMessage }}
      </div>
    </template>
  </Tooltip>
</template>

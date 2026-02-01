<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getDeprecatedInfo } from '../../state/payload'
import { settings } from '../../state/settings'

const props = withDefaults(defineProps<{
  pkg: PackageNode
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const deprecation = computed(() => getDeprecatedInfo(props.pkg))

const labelMap = {
  package: 'Package Deprecated',
  current: 'Current Version Deprecated',
  future: 'Future Deprecation',
}

const npmUrl = computed(() => {
  if (settings.value.preferNpmx) {
    return deprecation.value?.type === 'current'
      ? `https://npmx.dev/${props.pkg.name}@${props.pkg.version}`
      : `https://npmx.dev/${props.pkg.name}`
  }
  return deprecation.value?.type === 'current'
    ? `https://npmjs.com/package/${props.pkg.name}/v/${props.pkg.version}`
    : `https://npmjs.com/package/${props.pkg.name}`
})
</script>

<template>
  <a
    v-if="deprecation"
    px3 py2 block
    :href="npmUrl"
    :class="deprecation.type === 'future' ? 'badge-color-orange' : 'badge-color-red'"
    target="_blank"
  >
    <div
      v-if="showTitle"
      flex="~ gap-1 items-center"
      text-sm font-bold
      :class="deprecation.type === 'future' ? 'text-orange' : 'text-red'"
    >
      <div :class="deprecation.type === 'future' ? 'i-ph-warning-circle-duotone' : 'i-ph-warning-duotone'" flex-none />
      <div rounded-full font-mono>
        {{ labelMap[deprecation.type] }}
      </div>
    </div>
    <div text-sm>
      {{ deprecation.current || deprecation.latest }}
    </div>
  </a>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getDeprecatedInfo, getVulnerability } from '../../state/payload'

const props = defineProps<{
  pkg: PackageNode
}>()

const deprecation = computed(() => getDeprecatedInfo(props.pkg))
const vulnerability = computed(() => getVulnerability(props.pkg))
</script>

<template>
  <span>
    <span
      v-if="pkg.workspace"
      h-1em w-1.5em relative of-visible inline-block
    >
      <div
        title="Workspace Package"
        i-catppuccin-folder-packages-open icon-catppuccin mr2 absolute left-0 top-0
      />
    </span>
    <DisplayPackageName
      v-tooltip="deprecation?.latest ? `Package is deprecated: ${deprecation.latest}` : undefined"
      :name="props.pkg.name"
      :pkg="props.pkg"
      :class="!deprecation?.latest ? undefined : deprecation?.type === 'future' ? 'text-orange line-through' : 'text-red line-through'"
    />
    <DisplayVersion
      v-tooltip="deprecation?.current ? `Current version is deprecated: ${deprecation.current}` : undefined"
      color-base
      :version="props.pkg.version"
      prefix="@"
      :class="{
        'text-red-700! dark:text-red-300! line-through': deprecation?.current || vulnerability?.level === 'critical',
        'text-orange-700! dark:text-orange-300! line-through': vulnerability?.level === 'high',
        'text-yellow-700! dark:text-yellow-300! line-through': vulnerability?.level === 'moderate',
        'text-gray-700! dark:text-gray-300! line-through': vulnerability?.level === 'low',
        'op-fade': !deprecation?.current && !vulnerability,
      }"
    />
  </span>
</template>

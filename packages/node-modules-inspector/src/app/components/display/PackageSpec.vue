<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'
import { getDeprecatedInfo } from '../../state/payload'

const props = defineProps<{
  pkg: PackageNode
}>()

const deprecation = computed(() => getDeprecatedInfo(props.pkg))
</script>

<template>
  <div flex gap-2 items-center>
    <span
      v-if="pkg.workspace"
      h-1em w-1.5em relative of-visible inline-block
    >
      <div
        title="Workspace Package"
        i-catppuccin-folder-packages-open icon-catppuccin mr2 absolute left-0 top-0
      />
    </span>
    <span>
      <DisplayPackageName
        v-tooltip="deprecation?.latest ? `Package is deprecated: ${deprecation.latest}` : undefined"
        :name="props.pkg.name"
        :pkg="props.pkg"
        :class="!deprecation?.latest ? undefined : deprecation?.type === 'future' ? 'text-orange line-through' : 'text-red line-through'"
      />
      <DisplayVersion
        v-tooltip="deprecation?.current ? `Current version is deprecated: ${deprecation.current}` : undefined"
        op-fade
        :version="props.pkg.version"
        prefix="@"
        :class="{ 'text-red line-through': deprecation?.current }"
      />
    </span>
    <DisplayProvenanceBadge
      :pkg="props.pkg"
    />
  </div>
</template>

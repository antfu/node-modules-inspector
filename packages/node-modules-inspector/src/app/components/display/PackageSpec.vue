<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'

const props = defineProps<{
  pkg: PackageNode
}>()

const isCurrentDeprecated = computed(() => props.pkg?.resolved?.deprecatedInfo?.current?.deprecated || false)

const deprecationTitle = computed(() => {
  if (isCurrentDeprecated.value) {
    const currentInfo = props.pkg?.resolved?.deprecatedInfo?.current
    if (currentInfo) {
      return `This package is deprecated: ${currentInfo.message}`
    }
  }
  return ''
})
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
    <DisplayPackageName :name="props.pkg.name" :pkg="props.pkg" />
    <DisplayVersion
      op50
      :version="props.pkg.version"
      prefix="@"
      :class="{ 'text-red-500 !op100': isCurrentDeprecated }"
      :title="deprecationTitle"
    />
  </span>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed } from 'vue'

const props = defineProps<{
  pkg: PackageNode
}>()

const isDeprecated = computed(() => props.pkg?.resolved?.deprecatedInfo?.deprecated || false)
const willBeDeprecated = computed(() => props.pkg?.resolved?.deprecatedInfo?.willbedeprecated)

const deprecationTitle = computed(() => {
  if (isDeprecated.value) {
    return 'This package is deprecated'
  }
  if (willBeDeprecated.value) {
    return `Will be deprecated in version ${willBeDeprecated.value.version} (${willBeDeprecated.value.versionsCount} versions ahead, ${willBeDeprecated.value.timeAfterCurrent} days after current)`
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
      :class="{ 'text-red-500 !op100': isDeprecated }"
      :title="deprecationTitle"
    />
  </span>
</template>

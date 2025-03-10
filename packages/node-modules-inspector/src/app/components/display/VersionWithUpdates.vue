<script setup lang="ts">
import type { NpmMetaLatest } from 'node-modules-tools'
import { Tooltip } from 'floating-vue'
import semver from 'semver'
import { computed } from 'vue'

const props = defineProps<{
  version?: string
  latest?: NpmMetaLatest | null
}>()

const versionDiff = computed(() => {
  if (!props.latest || !props.version)
    return ''
  return semver.diff(props.latest.version, props.version)
})

const updateAvailable = computed(() => {
  if (!props.latest || !props.version)
    return false
  return semver.gt(props.latest.version, props.version)
})
</script>

<template>
  <Tooltip v-if="version">
    <div flex="~ items-center gap-1">
      <DisplayVersion :version="version" op75 />
      <template v-if="latest">
        <div v-if="latest.version === version || !updateAvailable" text-sm op50>
          <div i-ph-calendar-check-duotone />
        </div>
        <div v-else-if="versionDiff" text-sm>
          <div :class="versionDiff === 'major' ? 'i-ph-arrow-fat-lines-up-duotone text-red' : 'i-ph-arrow-fat-line-up-duotone text-lime'" />
        </div>
      </template>
    </div>
    <template #popper>
      <div v-if="!latest">
        Version v{{ version }}
      </div>
      <div v-else-if="latest.version === version">
        Up to date, last published at <DisplayDateBadge :time="latest.publishedAt" inline-block />
      </div>
      <div v-else-if="updateAvailable">
        New {{ versionDiff }} version <DisplayVersion inline-block text-primary :version="latest.version" /> published at <DisplayDateBadge inline-block rounded :time="latest.publishedAt" /> is available
      </div>
    </template>
  </Tooltip>
</template>

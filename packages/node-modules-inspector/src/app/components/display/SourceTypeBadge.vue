<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { SettingsOptions } from '~~/shared/types'
import { computed } from 'vue'
import { settings } from '~/state/settings'

const props = defineProps<{
  pkg: PackageNode
  mode?: SettingsOptions['showDependencySourceBadge']
}>()

const mode = computed(() => props.mode || settings.value.showDependencySourceBadge)

const prod = computed(() => {
  if (mode.value === 'none')
    return false
  if (mode.value === 'dev')
    return false
  if (mode.value === 'prod')
    return props.pkg.prod && !props.pkg.dev
  return props.pkg.prod
})
const dev = computed(() => {
  if (mode.value === 'none')
    return false
  if (mode.value === 'prod')
    return false
  if (mode.value === 'dev')
    return props.pkg.dev && !props.pkg.prod
  return props.pkg.dev
})
</script>

<template>
  <template v-if="mode !== 'none'">
    <div v-if="prod && dev" badge-color-green px2 rounded-full text-sm title="Introduced by both dev and prod dependencies">
      dev+prod
    </div>
    <div v-else-if="!prod && dev" badge-color-cyan px2 rounded-full text-sm title="Introduced by dev dependencies">
      dev
    </div>
    <div v-if="prod && !dev" badge-color-lime px2 rounded-full text-sm title="Introduced by prod dependencies">
      prod
    </div>
  </template>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { SettingsOptions } from '../../../shared/types'
import type { ComputedPayload } from '../../state/payload'
import { computed } from 'vue'
import { payloads } from '../../state/payload'
import { settings } from '../../state/settings'

const props = withDefaults(
  defineProps<{
    pkg: PackageNode
    payload?: ComputedPayload
    mode?: SettingsOptions['showDependencySourceBadge']
  }>(),
  {
    payload: () => payloads.avaliable,
  },
)

const mode = computed(() => props.mode || settings.value.showDependencySourceBadge)

const prod = computed(() => {
  if (mode.value === 'none')
    return false
  if (mode.value === 'dev')
    return false
  if (mode.value === 'prod')
    return props.payload.isInDepCluster(props.pkg, 'prod') && !props.payload.isInDepCluster(props.pkg, 'dev')
  return props.payload.isInDepCluster(props.pkg, 'prod')
})
const dev = computed(() => {
  if (mode.value === 'none')
    return false
  if (mode.value === 'prod')
    return false
  if (mode.value === 'dev')
    return props.payload.isInDepCluster(props.pkg, 'dev') && !props.payload.isInDepCluster(props.pkg, 'prod')
  return props.payload.isInDepCluster(props.pkg, 'dev')
})
</script>

<template>
  <template v-if="mode !== 'none'">
    <div v-if="prod && dev" v-tooltip="'This package is introduced from both dev and prod dependencies'" badge-color-green px2 rounded-full text-sm>
      dev+prod
    </div>
    <div v-else-if="!prod && dev" v-tooltip="'This package is introduced from dev dependencies'" badge-color-cyan px2 rounded-full text-sm>
      dev
    </div>
    <div v-if="prod && !dev" v-tooltip="'This package is introduced from prod dependencies'" badge-color-lime px2 rounded-full text-sm>
      prod
    </div>
  </template>
</template>

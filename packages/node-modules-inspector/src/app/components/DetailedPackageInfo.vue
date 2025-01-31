<script setup lang="ts">
import type { ResolvedPackageNode } from 'node-modules-tools'

const props = defineProps<{
  pkg: ResolvedPackageNode
}>()
</script>

<template>
  <div>
    <div>
      {{ props.pkg.name }}<span>@{{ props.pkg.version }}</span>
    </div>
    <div>
      {{ props.pkg.resolved.module.toUpperCase() }}
    </div>
    <div>
      {{ props.pkg.resolved.license }}
    </div>
    <div>
      {{ props.pkg.resolved.author?.replace(/\<.*\>/, '').replace(/\(.*\)/, '') }}
    </div>
  </div>
</template>

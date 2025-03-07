<script setup lang="ts">
import { computed } from 'vue'
import { parseSemverRange } from '../../utils/semver'

const props = defineProps<{
  range?: string
}>()

const parsed = computed(() => props.range && parseSemverRange(props.range))
</script>

<template>
  <span
    v-if="range && parsed"
    font-mono px2 pl1 py0.5 rounded-lg text-sm flex="~ gap-2 items-center"
    :class="parsed.valid ? 'badge-color-gray !bg-active' : 'badge-color-red'"
  >
    <div i-catppuccin-package-json icon-catppuccin flex-none />
    <div v-if="!parsed.valid">
      {{ parsed.raw }}
    </div>
    <template v-else>
      <template v-for="part, idx of parsed.parts || []" :key="idx">
        <div v-if="idx !== 0" border="l base" h-4 w-1px flex-none />
        <div>{{ part }}</div>
      </template>
    </template>
  </span>
</template>

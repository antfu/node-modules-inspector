<script setup lang="ts">
import { ref } from 'vue'
import { selectedNode } from '../state/current'
import DetailedPackageInfo from './DetailedPackageInfo.vue'

const selected = ref('tree')

const tabsMeta = [
  {
    name: 'Tree View',
    value: 'tree',
    icon: 'i-ph-tree-structure-duotone',
  },
  {
    name: 'List View',
    value: 'list',
    icon: 'i-ph-list-dashes-duotone',
  },
]
</script>

<template>
  <div fixed left-4 top-4 bottom-4 w-100 z-100 flex="~ gap-4 col">
    <div
      bg-glass rounded-full border border-base shadow px3 py2 flex-none
      flex="~ items-center gap-1" w-max
    >
      <template v-for="tab of tabsMeta" :key="tab.value">
        <button
          w-10 h-10 rounded-full hover:bg-active
          flex="~ items-center justify-center"
          :title="tab.name"
          :class="tab.value === selected ? 'text-primary' : 'op50'"
          @click="selected = tab.value"
        >
          <div :class="tab.icon" text-xl />
        </button>
      </template>
    </div>
    <div v-if="selectedNode" bg-glass rounded-1em border border-base shadow p5 flex-auto>
      <DetailedPackageInfo :pkg="selectedNode" />
    </div>
  </div>
</template>

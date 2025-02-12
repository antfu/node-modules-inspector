<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'
import type { WritableComputedRef } from 'vue'
import { computed } from 'vue'
import { filters, FILTERS_DEFAULT } from '~/state/filters'
import { query } from '~/state/query'
import { settings } from '~/state/settings'
import { MODULE_TYPES_FULL_SELECT, MODULE_TYPES_SIMPLE_SELECT } from '~/utils/module-type'

const moduleTypesAvailable = computed<PackageModuleType[]>(() =>
  settings.value.moduleTypeSimple
    ? MODULE_TYPES_SIMPLE_SELECT
    : MODULE_TYPES_FULL_SELECT,
)

function createModuleTypeRef(name: PackageModuleType) {
  return computed({
    get() {
      return filters.state.modules == null || filters.state.modules.includes(name)
    },
    set(v) {
      const current = new Set(filters.state.modules ? filters.state.modules : moduleTypesAvailable.value)
      if (v)
        current.add(name)
      else
        current.delete(name)

      if (current.size >= moduleTypesAvailable.value.length) {
        filters.state.modules = null
      }
      else {
        filters.state.modules = Array.from(current)
      }
    },
  })
}

const moduleTypes = Object.fromEntries(
  MODULE_TYPES_FULL_SELECT.map(x => [x, createModuleTypeRef(x)] as const),
) as Record<PackageModuleType, WritableComputedRef<boolean>>
</script>

<template>
  <div
    v-if="filters.select.activated.length"
    fixed right-32 top-4 z-panel-nav pl3 p1
    bg-glass rounded-3xl border border-base shadow
    flex="~ gap-2 items-center"
  >
    <button relative @click="query.selected = '~filters'">
      <div i-ph-funnel-duotone text-xl op50 />
      <div v-if="filters.select.activated.length" absolute top--2 right--2 w-4 h-4 bg-primary-600 shadow text-white rounded-full flex text-0.6rem>
        <span ma>{{ filters.select.activated.length }}</span>
      </div>
    </button>

    <div v-if="filters.search.parsed.text" badge-color-primary flex="~ gap-1 items-center" px1 rounded>
      <div i-ph-text-t-duotone />
      {{ filters.search.parsed.text }}
    </div>
    <div v-if="filters.state['source-type'] !== FILTERS_DEFAULT['source-type']" badge-color-blue capitalize flex="~ gap-1 items-center" px1 rounded>
      <div i-ph-tree-view-duotone />
      {{ filters.state['source-type'] }}
    </div>
    <div v-if="filters.state.modules !== FILTERS_DEFAULT.modules" flex="~ gap-1 items-center">
      <template
        v-for="type of moduleTypesAvailable"
        :key="type"
      >
        <DisplayModuleType
          v-if="moduleTypes[type].value"
          :pkg="type"
          :force="true"
          :class="moduleTypes[type].value ? '' : 'saturate-0 op75'"
        />
      </template>
    </div>
    <div v-if="filters.search.parsed.author?.length" badge-color-gray flex="~ gap-1 items-center" px1 rounded>
      <div i-ph-user-circle-duotone />
      {{ filters.search.parsed.author.map(a => a.source).join(', ') }}
    </div>
    <div v-if="filters.search.parsed.license?.length" badge-color-gray flex="~ gap-1 items-center" px1 rounded>
      <div i-ph-file-text-duotone />
      {{ filters.search.parsed.license.map(a => a.source).join(', ') }}
    </div>
    <div v-if="filters.state.focus" badge-color-green font-mono flex="~ gap-1 items-center" px1 rounded>
      <div i-ph-arrows-in-cardinal-duotone />
      {{ filters.state.focus.join(', ') }}
    </div>
    <div v-if="filters.state.why" badge-color-orange font-mono flex="~ gap-1 items-center" px1 rounded>
      <div i-ph-seal-question-duotone />
      {{ filters.state.why.join(', ') }}
    </div>

    <button
      w8 h8 ml--2 rounded-full hover:bg-active op50 hover:op100 flex="~ items-center justify-center"
      title="Clear Filters"
      @click="filters.select.reset()"
    >
      <div i-ph-x />
    </button>
  </div>
</template>

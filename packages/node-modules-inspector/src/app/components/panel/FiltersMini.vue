<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'
import type { WritableComputedRef } from 'vue'
import { computed } from 'vue'
import { filters, filtersDefault, isDeepEqual } from '~/state/filters'
import { query } from '~/state/query'
import { MODULE_TYPES_FULL_SELECT, moduleTypesAvailableSelect } from '~/utils/module-type'

function createModuleTypeRef(name: PackageModuleType) {
  return computed({
    get() {
      return filters.state.modules == null || filters.state.modules.includes(name)
    },
    set(v) {
      const current = new Set(filters.state.modules ? filters.state.modules : moduleTypesAvailableSelect.value)
      if (v)
        current.add(name)
      else
        current.delete(name)

      if (current.size >= moduleTypesAvailableSelect.value.length) {
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
    fixed right-28 top-5 z-panel-nav
    bg-glass rounded-3xl border border-base shadow
    flex="~"
  >
    <button relative pl2 pr1 @click="query.selected = '~filters'">
      <div i-ph-funnel-duotone text-xl op50 />
      <div v-if="filters.select.activated.length" absolute top--2 right--2 w-4 h-4 bg-primary-600 shadow text-white rounded-full flex text-0.6rem>
        <span ma>{{ filters.select.activated.length }}</span>
      </div>
    </button>

    <div v-if="filters.search.parsed.text" border="l base" flex="~ gap-1 items-center" px2>
      <div i-ph-text-t-duotone />
      {{ filters.search.parsed.text }}
    </div>
    <div v-if="!isDeepEqual(filters.state.sourceType, filtersDefault.sourceType)" border="l base" flex="~ gap-1 items-center" px2>
      <div i-ph-tree-view-duotone />
      <span capitalize>
        {{ filters.state.sourceType }}
      </span>
    </div>
    <div v-if="!isDeepEqual(filters.state.depths, filtersDefault.depths)" border="l base" flex="~ gap-1 items-center" px2>
      <div i-ph-stack-duotone />
      <span>
        {{ filters.state.depths?.map(i => `#${i}`).join(', ') || 'None' }}
      </span>
    </div>
    <div v-if="!isDeepEqual(filters.state.modules, filtersDefault.modules)" border="l base" flex="~ gap-1 items-center" px2>
      <template
        v-for="type of moduleTypesAvailableSelect"
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
    <div v-if="filters.search.parsed.author?.length" border="l base" flex="~ gap-1 items-center" px2>
      <div i-ph-user-circle-duotone text-blue />
      {{ filters.search.parsed.author.map(a => a.source).join(', ') }}
    </div>
    <div v-if="filters.search.parsed.license?.length" border="l base" flex="~ gap-1 items-center" px2>
      <div i-ph-file-text-duotone text-purple />
      {{ filters.search.parsed.license.map(a => a.source).join(', ') }}
    </div>
    <div v-if="filters.state.focus" border="l base" flex="~ gap-1 items-center" font-mono px2>
      <div i-ph-arrows-in-cardinal-duotone text-primary />
      {{ filters.state.focus.join(', ') }}
    </div>
    <div v-if="filters.state.why" border="l base" flex="~ gap-1 items-center" font-mono px2>
      <div i-ph-seal-question-duotone text-orange />
      {{ filters.state.why.join(', ') }}
    </div>

    <button
      w8 h8 rounded-full hover:bg-active op50 hover:op100 flex="~ items-center justify-center"
      title="Clear Filters"
      @click="filters.select.reset()"
    >
      <div i-ph-x />
    </button>
  </div>
</template>

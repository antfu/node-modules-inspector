<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'
import type { WritableComputedRef } from 'vue'
import { computed } from 'vue'
import { settings } from '~/state/settings'
import { avaliablePackages, filteredPackages, filters } from '../../state/filters'
import { MODULE_TYPES_FULL, MODULE_TYPES_SIMPLE } from '../../utils/module-type'

const moduleTypesAvailable = computed<PackageModuleType[]>(() =>
  settings.value.moduleTypeSimple
    ? MODULE_TYPES_SIMPLE
    : MODULE_TYPES_FULL,
)

function createModuleTypeRef(name: PackageModuleType) {
  return computed({
    get() {
      return filters.modules == null || filters.modules.includes(name)
    },
    set(v) {
      const current = new Set(filters.modules ? filters.modules : moduleTypesAvailable.value)
      if (v)
        current.add(name)
      else
        current.delete(name)

      if (current.size >= moduleTypesAvailable.value.length) {
        filters.modules = null
      }
      else {
        filters.modules = Array.from(current)
      }
    },
  })
}

function removeFocus(spec: string) {
  if (filters.focus) {
    const arr = filters.focus.filter(x => x !== spec)
    if (arr.length === 0)
      filters.focus = null
    else
      filters.focus = arr
  }
}

const moduleTypes = Object.fromEntries(
  MODULE_TYPES_FULL.map(x => [x, createModuleTypeRef(x)] as const),
) as Record<PackageModuleType, WritableComputedRef<boolean>>
</script>

<template>
  <div>
    <div flex="~ col gap-4">
      <label
        p4 flex-none h-full
        flex="~ items-center gap-1.5"
        hover:bg-active
      >
        <div i-ph-funnel-duotone text-lg :class="filters.search ? 'text-primary' : 'op50'" flex-none />
        <input
          v-model="filters.search"
          placeholder="Filter by text"
          w-full bg-transparent outline-none
        >
        <button
          w-6 h-6 rounded-full hover:bg-active flex
          :class="filters.search ? '' : 'op0'"
          @click="filters.search = ''"
        >
          <div i-ph-x ma op50 />
        </button>
      </label>
    </div>
    <div flex="~ col gap-4" p4 border="t base">
      <OptionItem title="Dependency Source" description="Filter by source type of the dependency">
        <OptionSelectGroup
          v-model="filters.sourceType"
          :options="[null, 'prod', 'dev']"
          :titles="['All', 'Prod', 'Dev']"
        />
      </OptionItem>
    </div>
    <div v-if="filters.focus" flex="~ col gap-2" p4 border="t base">
      <div>Focusing On</div>
      <div flex="~ gap-2 wrap">
        <div
          v-for="spec of filters.focus"
          :key="spec"
          badge-color-primary rounded-full px2 pl3 py0.5
          flex="~ gap-1 items-center"
        >
          <div font-mono text-sm>
            {{ spec }}
          </div>
          <button op50 hover:op100 @click="removeFocus(spec)">
            <div i-ph-x op50 />
          </button>
        </div>
      </div>
    </div>
    <div flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-4 wrap">
        <label
          v-for="type of moduleTypesAvailable"
          :key="type"
          flex="~ gap-1 items-center"
        >
          <OptionCheckbox
            v-model="moduleTypes[type].value"
          />
          <DisplayModuleType
            :pkg="type"
            :force="true"
            :class="moduleTypes[type].value ? '' : 'saturate-0 op75'"
          />
        </label>
      </div>
    </div>
    <div>
      <ModuleTypePercentage :packages="filteredPackages" :rounded="false" />
      <div p3 flex="~ items-center gap-2">
        <DisplayNumberBadge :number="filteredPackages.length" rounded-full color="badge-color-primary" />
        <span op50>of</span>
        <DisplayNumberBadge :number="avaliablePackages.length" rounded-full />
        <span op50>packages filtered</span>
      </div>
    </div>
    <!-- <PanelSettings border="t base" /> -->
  </div>
</template>

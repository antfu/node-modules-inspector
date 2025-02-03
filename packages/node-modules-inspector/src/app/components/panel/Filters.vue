<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'
import type { WritableComputedRef } from 'vue'
import { computed } from 'vue'
import { filters } from '~/state/filters'
import { payload } from '~/state/payload'
import { settings } from '~/state/settings'
import { MODULE_TYPES_FULL_SELECT, MODULE_TYPES_SIMPLE_SELECT } from '../../utils/module-type'

const moduleTypesAvailable = computed<PackageModuleType[]>(() =>
  settings.value.moduleTypeSimple
    ? MODULE_TYPES_SIMPLE_SELECT
    : MODULE_TYPES_FULL_SELECT,
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
  if (!filters.focus)
    return
  const arr = filters.focus.filter(x => x !== spec)
  filters.focus = arr.length === 0 ? null : arr
}

function removeExclude(spec: string) {
  if (!filters.excludes)
    return
  const arr = filters.excludes.filter(x => x !== spec)
  filters.excludes = arr.length === 0 ? null : arr
}

const moduleTypes = Object.fromEntries(
  MODULE_TYPES_FULL_SELECT.map(x => [x, createModuleTypeRef(x)] as const),
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
          v-model="filters['source-type']"
          :options="[null, 'prod', 'dev']"
          :titles="['All', 'Prod', 'Dev']"
        />
      </OptionItem>
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
    <div flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-arrows-in-cardinal-duotone flex-none />
        Focus On
      </div>
      <div v-if="filters.focus" flex="~ gap-2 wrap">
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
      <div v-else op50 text-sm italic>
        To focus on a specific package, select from its menu
      </div>
    </div>
    <div flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-network-slash-duotone flex-none />
        Excludes
      </div>
      <div v-if="filters.excludes" flex="~ gap-2 wrap">
        <div
          v-for="spec of filters.excludes"
          :key="spec"
          badge-color-purple rounded-full px2 pl3 py0.5
          flex="~ gap-1 items-center"
        >
          <div font-mono text-sm>
            {{ spec }}
          </div>
          <button op50 hover:op100 @click="removeExclude(spec)">
            <div i-ph-x op50 />
          </button>
        </div>
      </div>
      <div v-else op50 text-sm italic>
        To exclude a specific package, select from its menu
      </div>
      <div mt2>
        <OptionItem title="Exclude DTS Packages" description="Exclude TypeScript declaration packages">
          <OptionCheckbox v-model="filters['exclude-dts']" />
        </OptionItem>
      </div>
    </div>

    <div border="t base">
      <div flex="~ gap-2 items-center" p4 pb0>
        <div i-ph-chart-bar-duotone flex-none />
        Filter Results
      </div>
      <div p3 flex="~ col gap-2 ">
        <div flex="~ items-center gap-2">
          <DisplayNumberBadge :number="payload.filtered.packages.length" rounded-full color="badge-color-primary" />
          <span op50>of</span>
          <DisplayNumberBadge :number="payload.avaliable.packages.length" rounded-full />
          <span op50>packages filtered</span>
        </div>
        <div v-if="payload.excluded.packages.size" flex="~ items-center gap-1" text-0.85rem>
          <span op25>(</span>
          <DisplayNumberBadge :number="payload.excluded.packages.size" rounded-full />
          <span op50>packages excluded</span>
          <span op25>)</span>
        </div>
      </div>
      <ModuleTypePercentage :packages="payload.filtered.packages" :rounded="false" />
    </div>
    <!-- <PanelSettings border="t base" /> -->
  </div>
</template>

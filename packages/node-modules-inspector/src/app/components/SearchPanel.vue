<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'
import type { WritableComputedRef } from 'vue'
import { Menu as VMenu } from 'floating-vue'
import { computed } from 'vue'
import { settings } from '~/state/settings'
import { activatedFilters, filters } from '../state/filters'

const FULL_MODULE_TYPES = ['cjs', 'faux', 'esm', 'dual', 'dts'] as PackageModuleType[]

const moduleTypesAvailable = computed<PackageModuleType[]>(() => settings.value.moduleTypeSimple
  ? ['cjs', 'esm', 'dts']
  : FULL_MODULE_TYPES,
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

const moduleTypes = Object.fromEntries(FULL_MODULE_TYPES.map(x => [x, createModuleTypeRef(x)] as const)) as Record<PackageModuleType, WritableComputedRef<boolean>>
</script>

<template>
  <div fixed right-4 top-4 z-100 flex="~ gap-2 items-center">
    <div
      bg-glass rounded-full border border-base shadow
      focus-within="ring-4 ring-primary:20"
      :class="filters.search ? 'border-primary' : ''"
    >
      <label
        pl4 pr3 py2 flex-none rounded-full
        flex="~ items-center gap-1.5"
      >
        <div i-ph-magnifying-glass-duotone :class="filters.search ? 'text-primary' : 'op50'" />
        <input
          v-model="filters.search"
          placeholder="Search to filter"
          w-50 bg-transparent outline-none
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

    <div
      bg-glass rounded-full border border-base shadow flex-none
      flex="~ items-center gap-1" w-max relative
    >
      <VMenu placement="bottom-end">
        <button
          w-10 h-10 rounded-full hover:bg-active
          flex="~ items-center justify-center"
          title="Settings"
          :class="activatedFilters.length ? 'text-primary' : ''"
        >
          <div i-ph-funnel-duotone text-xl />
        </button>
        <template #popper>
          <div flex="~ col gap-4" p4>
            <OptionItem title="Dependency Source" description="Filter by source type of the dependency">
              <OptionSelectGroup
                v-model="filters.sourceType"
                :options="[null, 'prod', 'dev']"
                :titles="['All', 'Prod', 'Dev']"
              />
            </OptionItem>
          </div>
          <div flex="~ col gap-2" p4 border="t base">
            <div flex="~ gap-4">
              <label
                v-for="type of moduleTypesAvailable"
                :key="type"
                flex="~ gap-1 items-center"
              >
                <OptionCheckbox
                  v-model="moduleTypes[type].value"
                />
                <ModuleTypeLabel
                  :pkg="type"
                  :class="moduleTypes[type].value ? '' : 'saturate-0 op75'"
                />
              </label>
            </div>
          </div>
        </template>
      </VMenu>
      <div v-if="activatedFilters.length" absolute top--1.2 right--1.2 w-4 h-4 bg-primary-600 shadow text-white rounded-full flex text-0.6rem>
        <span ma>{{ activatedFilters.length }}</span>
      </div>
    </div>
  </div>
</template>

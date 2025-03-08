<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'
import type { WritableComputedRef } from 'vue'
import { computed } from 'vue'
import { filters } from '../../state/filters'
import { MODULE_TYPES_FULL_SELECT, moduleTypesAvailableSelect } from '../../utils/module-type'

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
  <div flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-4 wrap">
      <label
        v-for="type of moduleTypesAvailableSelect"
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
</template>

<script setup lang="ts">
import type { PackageModuleType } from 'node-modules-tools'
import type { WritableComputedRef } from 'vue'
import { computed } from 'vue'
import { filters } from '~/state/filters'
import { payloads } from '~/state/payload'
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

const availableDepths = computed(() => {
  let max = 0
  for (const pkg of payloads.avaliable.packages) {
    if (pkg.depth > max) {
      max = pkg.depth
    }
  }
  return Array.from({ length: max + 1 }, (_, i) => i)
})

function createDepthRef(value: number) {
  return computed<boolean>({
    get() {
      return filters.state.depths == null || filters.state.depths.some(x => +x === value)
    },
    set(v) {
      const current = new Set((filters.state.depths ? filters.state.depths : availableDepths.value).map(i => +i))
      if (v)
        current.add(value)
      else
        current.delete(value)

      if (current.size >= availableDepths.value.length) {
        filters.state.depths = null
      }
      else {
        filters.state.depths = Array.from(current)
      }
    },
  })
}

const depthsRefs = computed(() => availableDepths.value.map(i => createDepthRef(i)))
const depthsRefsAll = computed({
  get() {
    return filters.state.depths == null || filters.state.depths.length === availableDepths.value.length
  },
  set(v) {
    filters.state.depths = v ? null : []
  },
})
const depthGridRows = computed(() => Math.ceil(availableDepths.value.length / 3))

const moduleTypes = Object.fromEntries(
  MODULE_TYPES_FULL_SELECT.map(x => [x, createModuleTypeRef(x)] as const),
) as Record<PackageModuleType, WritableComputedRef<boolean>>
</script>

<template>
  <div>
    <div p4 flex="~ gap-2 items-center">
      <button
        btn-action :disabled="filters.select.activated.length === 0"
        @click="filters.select.reset()"
      >
        <div i-ph-funnel-x-duotone />
        Reset Filters
      </button>
      <button
        btn-action :disabled="filters.exclude.activated.length === 0"
        @click="filters.exclude.reset()"
      >
        <div i-ph-trash-simple-duotone />
        Reset Excludes
      </button>
    </div>
    <div flex="~ col gap-4" border="t base">
      <label
        p4 flex-none h-full
        flex="~ items-center gap-1.5"
        hover:bg-active
      >
        <div i-ph-text-t-duotone text-lg :class="filters.search ? 'text-primary' : 'op50'" flex-none />
        <input
          v-model="filters.state.search"
          placeholder="Filter by Text"
          w-full bg-transparent outline-none
        >
        <button
          w-6 h-6 rounded-full hover:bg-active flex
          :class="filters.state.search ? '' : 'op0'"
          @click="filters.state.search = ''"
        >
          <div i-ph-x ma op50 />
        </button>
      </label>
    </div>
    <div flex="~ col gap-4" p4 border="t base">
      <OptionItem title="Dependency Source" description="Filter by source type of the dependency">
        <OptionSelectGroup
          v-model="filters.state.sourceType"
          :options="[null, 'prod', 'dev']"
          :titles="['All', 'Prod', 'Dev']"
        />
      </OptionItem>
    </div>
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
    <div v-if="filters.search.parsed.author?.length" flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-user-circle-duotone flex-none />
        <div>
          <div>Authors</div>
        </div>
      </div>
      <div flex="~ gap-2 wrap">
        <div
          v-for="author, idx of filters.search.parsed.author" :key="idx"
          font-mono text-sm badge-color-gray rounded-full px2 py0.5
          flex="~ gap-1 items-center"
        >
          {{ author.source }}
        </div>
      </div>
    </div>
    <div v-if="filters.search.parsed.license?.length" flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-file-text-duotone flex-none />
        <div>
          <div>License</div>
        </div>
      </div>
      <div flex="~ gap-2 wrap">
        <div
          v-for="license, idx of filters.search.parsed.license" :key="idx"
          font-mono text-sm badge-color-gray rounded-full px2 py0.5
          flex="~ gap-1 items-center"
        >
          {{ license.source }}
        </div>
      </div>
    </div>

    <div v-if="filters.state.focus" flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-arrows-in-cardinal-duotone flex-none />
        <div>
          <div>Focus On</div>
          <div op50 text-sm mt--0.5>
            Filter specific packages and their dependencies
          </div>
        </div>
      </div>
      <div flex="~ gap-2 wrap">
        <div
          v-for="spec of filters.state.focus"
          :key="spec"
          badge-color-primary rounded-full px2 pl3 py0.5
          flex="~ gap-1 items-center"
        >
          <div font-mono text-sm>
            {{ spec }}
          </div>
          <button op50 hover:op100 @click="filters.focus.toggle(spec, false)">
            <div i-ph-x op50 />
          </button>
        </div>
      </div>
    </div>
    <div v-if="filters.state.why" flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-seal-question-duotone flex-none />
        <div>
          <div>Why</div>
          <div op50 text-sm mt--0.5>
            Filter dependents to see why packages are used
          </div>
        </div>
      </div>
      <div flex="~ gap-2 wrap">
        <div
          v-for="spec of filters.state.why"
          :key="spec"
          badge-color-yellow rounded-full px2 pl3 py0.5
          flex="~ gap-1 items-center"
        >
          <div font-mono text-sm>
            {{ spec }}
          </div>
          <button op50 hover:op100 @click="filters.why.toggle(spec, false)">
            <div i-ph-x op50 />
          </button>
        </div>
      </div>
    </div>

    <div flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-stack-duotone flex-none />
        <div flex-auto>
          Dependency Depth
        </div>
        <label
          flex="~ gap-1 items-center"
        >
          <OptionCheckbox
            v-model="depthsRefsAll"
          />
          <div>
            All
          </div>
          <DisplayNumberBadge
            :number="payloads.avaliable.packages.length"
            rounded-full text-xs
          />
        </label>
      </div>
      <div grid="~ flow-col" :style="`grid-template-rows: repeat(${depthGridRows}, minmax(0, 1fr));`">
        <label
          v-for="depth of availableDepths"
          :key="depth"
          flex="~ gap-1 items-center"
        >
          <OptionCheckbox
            v-model="depthsRefs[depth].value"
          />
          <div font-mono>
            #{{ depth }}
          </div>
          <DisplayNumberBadge
            :number="payloads.avaliable.packages.filter(p => p.depth === depth).length"
            rounded-full text-xs
          />
        </label>
      </div>
    </div>

    <div flex="~ col gap-2" p4 border="t base">
      <div flex="~ gap-2 items-center">
        <div i-ph-network-slash-duotone flex-none />
        Excludes
      </div>
      <div v-if="filters.state.excludes" flex="~ gap-2 wrap">
        <div
          v-for="spec of filters.state.excludes"
          :key="spec"
          badge-color-purple rounded-full px2 pl3 py0.5
          flex="~ gap-1 items-center"
        >
          <div font-mono text-sm>
            {{ spec }}
          </div>
          <button op50 hover:op100 @click="filters.excludes.toggle(spec, false)">
            <div i-ph-x op50 />
          </button>
        </div>
      </div>
      <div v-else op50 text-sm italic>
        To exclude a specific package, select from its menu
      </div>
      <div mt2 flex="~ col gap-1">
        <OptionItem title="Exclude Types Packages" description="Exclude TypeScript declaration packages">
          <OptionCheckbox v-model="filters.state.excludeDts" />
        </OptionItem>
        <OptionItem title="Exclude Private Packages" description="Exclude private workspace packages and their dependencies">
          <OptionCheckbox v-model="filters.state.excludePrivate" />
        </OptionItem>
        <OptionItem title="Exclude Workspace Roots" description="Exclude workspaces but NOT their dependencies">
          <OptionCheckbox v-model="filters.state.excludeWorkspace" />
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
          <DisplayNumberBadge :number="payloads.filtered.packages.length" rounded-full color="badge-color-primary" />
          <span op50>of</span>
          <DisplayNumberBadge :number="payloads.avaliable.packages.length" rounded-full />
          <span op50>packages filtered</span>
        </div>
        <div v-if="payloads.excluded.packages.length" flex="~ items-center gap-1" text-0.85rem>
          <span op25>(</span>
          <DisplayNumberBadge :number="payloads.excluded.packages.length" rounded-full />
          <span op50>packages excluded</span>
          <span op25>)</span>
        </div>
      </div>
      <UiPercentageModuleType :packages="payloads.filtered.packages" :rounded="false" />
    </div>
    <!-- <PanelSettings border="t base" /> -->
  </div>
</template>

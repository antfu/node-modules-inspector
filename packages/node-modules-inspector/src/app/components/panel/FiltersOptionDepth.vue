<script setup lang="ts">
import { computed } from 'vue'
import { filters } from '../../state/filters'
import { payloads } from '../../state/payload'

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

function selectOnly(depth: number) {
  filters.state.depths = [depth]
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
</script>

<template>
  <div flex="~ col gap-2" p4 border="t base">
    <div flex="~ gap-2 items-center">
      <div
        v-tooltip="'Dependency depth is the number of dependencies between the root package and the target package'"
        flex="~ gap-2 items-center"
      >
        <div i-ph-stack-duotone flex-none />
        <div>
          Dependency Depth
        </div>
      </div>
      <div flex-auto />
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
        flex="~ gap-1 items-center" select-none
        @dblclick.prevent="selectOnly(depth)"
      >
        <OptionCheckbox
          v-model="depthsRefs[depth]!.value"
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
</template>

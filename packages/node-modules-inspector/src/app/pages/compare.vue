<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed, shallowReactive } from 'vue'
import { definePageMeta } from '#imports'
import GraphCanvas from '../components/graph/Canvas.vue'
import OptionPackageMultiSelectInput from '../components/option/PackageMultiSelectInput.vue'
import { selectedNode } from '../state/current'
import { filters } from '../state/filters'
import { payloads } from '../state/payload'

const payload = payloads.available

const selectedA = shallowReactive(new Set<PackageNode>())
const selectedB = shallowReactive(new Set<PackageNode>())

const selectedAll = computed(() => [...selectedA, ...selectedB])

const rootPackages = computed(() => {
  return [
    ...filters.state.compareA || [],
    ...filters.state.compareB || [],
  ]
    .map(x => payload.get(x))
    .filter(x => !!x)
})

const showGraph = computed(() => filters.state.compareA?.length && filters.state.compareB?.length)

definePageMeta({
  noOffset: showGraph,
})

function compare() {
  if (!selectedA.size || !selectedB.size)
    return

  selectedNode.value = undefined
  filters.state.compareA = Array.from(selectedA).map(x => x.spec)
  filters.state.compareB = Array.from(selectedB).map(x => x.spec)
}

function reset() {
  selectedA.clear()
  selectedB.clear()
  filters.state.compareA?.forEach(x => selectedA.add(payload.get(x)!))
  filters.state.compareB?.forEach(x => selectedB.add(payload.get(x)!))

  filters.state.compareA = null
  filters.state.compareB = null
}
</script>

<template>
  <div
    v-if="!showGraph"
    flex="~ col items-center justify-center gap-10" mt-10
  >
    <div text-center>
      <h1 text-2xl font-bold>
        Select packages to compare
      </h1>
      <p op-fade>
        Use the filters to select packages to compare
      </p>
    </div>
    <div grid="~ cols-[1fr_max-content_1fr] gap-2">
      <div>
        <!-- `-700`/`dark:-300`, not the DEFAULT shade + `op75` — even at 700,
             op75's dilution drops this under 4.5:1 (axe-core-measured, ~3.1:1),
             so drop the opacity too rather than chase a shade that survives it. -->
        <div text-yellow-700 dark:text-yellow-300 p2 text-center>
          Compare Group A
        </div>
        <OptionPackageMultiSelectInput v-model:selected="selectedA" :excludes="selectedAll">
          <template #icon>
            <div i-ph-package-duotone text-lg text-yellow flex-none />
          </template>
        </OptionPackageMultiSelectInput>
      </div>
      <div p2 rounded op-fade py13>
        vs
      </div>
      <div>
        <!-- See the note on "Compare Group A" above. -->
        <div text-purple-700 dark:text-purple-300 p2 text-center>
          Compare Group B
        </div>
        <OptionPackageMultiSelectInput v-model:selected="selectedB" :excludes="selectedAll">
          <template #icon>
            <div i-ph-package-duotone text-lg text-purple flex-none />
          </template>
        </OptionPackageMultiSelectInput>
      </div>
    </div>

    <button
      :disabled="!selectedA.size || !selectedB.size"
      class="disabled:op-mute disabled:pointer-events-none"
      px5 py1 text-lg border="~ base rounded-full" hover="bg-hover op100"
      @click="compare"
    >
      Start Compare
    </button>
  </div>
  <template v-else>
    <GraphCanvas
      :payload="payloads.filtered"
      :root-packages="rootPackages"
      highlight-mode="compare"
    />
    <div
      border="~ base rounded-full" z-panel-nav
      fixed top-4 left="50%" transform="-50%" bg-glass shadow of-hidden
    >
      <button
        px5 py1 text-lg hover="bg-hover op100" op-fade
        @click="reset"
      >
        Start a new compare
      </button>
    </div>
  </template>
</template>

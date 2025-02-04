<script setup lang="ts">
import { computed, ref } from 'vue'
import { selectedNode } from '~/state/current'
import { payload } from '~/state/payload'

const count = ref(15)

const depsCountMap = computed(() => {
  return new Map(Array.from(payload.filtered.packages)
    .map(x => [
      x,
      Array.from(x.flatDependencies)
        .filter(dep => payload.avaliable.map.has(dep))
        .length,
    ] as const))
})

const transitiveDeps = computed(() =>
  Array.from(payload.filtered.packages)
    .filter(x => !x.workspace && depsCountMap.value.get(x))
    .sort((a, b) => depsCountMap.value.get(b)! - depsCountMap.value.get(a)!),
)

const top = computed(() => transitiveDeps.value.slice(0, count.value))
</script>

<template>
  <div v-if="top.length">
    <SubTitle>
      Packages with the Most of Transitive Dependencies
      <DisplayNumberBadge :number="transitiveDeps.length" rounded-full text-sm />
    </SubTitle>
    <div flex flex-col gap2 border="~ rounded-xl base" p4 bg-glass of-auto>
      <div grid="~ cols-[max-content_max-content_1fr] gap-x-4 gap-y-1">
        <template v-for="pkg of top" :key="pkg.spec">
          <button
            font-mono text-left hover:bg-active px2 ml--2 rounded
            @click="selectedNode = pkg"
          >
            <DisplayPackageSpec :pkg />
          </button>
          <div flex="~ justify-end items-center">
            <DisplayNumberBadge
              :number="depsCountMap.get(pkg)!"
              rounded-full text-sm h-max
            />
          </div>
          <ModuleTypePercentage :pkg="pkg" :flat="true" />
        </template>
      </div>

      <button
        v-if="transitiveDeps.length > count"
        flex gap1 items-center self-end op50 hover:bg-active hover:op100 px4 py2 rounded-full
        @click="count = Math.round(count * 1.5)"
      >
        <div class="i-ri:arrow-down-double-line" />
        More
      </button>
    </div>
  </div>
</template>

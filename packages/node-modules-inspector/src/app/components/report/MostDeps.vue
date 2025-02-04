<script setup lang="ts">
import { computed, ref } from 'vue'
import { selectedNode } from '~/state/current'
import { payload } from '~/state/payload'

const count = ref(20)

const transitiveDeps = computed(() =>
  Array.from(payload.filtered.packages)
    .filter(x => !x.workspace && x.flatDependencies.size > 0)
    .sort((a, b) => b.flatDependencies.size - a.flatDependencies.size),
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
              :number="pkg.flatDependencies.size"
              rounded-full text-sm h-max
            />
          </div>
          <ModuleTypePercentage :pkg="pkg" :flat="true" />
        </template>
      </div>

      <button v-if="transitiveDeps.length > count" flex gap1 items-center self-end hover:bg-active px4 py2 rounded-full @click="count *= 1.5">
        <div class="i-ri:arrow-down-double-line" />
        More
      </button>
    </div>
  </div>
</template>

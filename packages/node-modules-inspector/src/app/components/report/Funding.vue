<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { ResolvedFunding } from '~/utils/funding'
import { computed } from 'vue'
import { selectedNode } from '~/state/current'
import { payloads } from '~/state/payload'
import { parseFunding } from '~/utils/funding'

const fundingGroup = computed(() => {
  const map = new Map<string, {
    info: ResolvedFunding
    packages: PackageNode[]
  }>()
  for (const pkg of payloads.filtered.packages) {
    if (pkg.workspace)
      continue
    const funding = parseFunding(pkg.resolved.funding?.url)
    if (!funding)
      continue
    const group = map.get(funding.entry) ?? {
      info: funding,
      packages: [],
    }
    group.packages.push(pkg)
    map.set(funding.entry, group)
  }
  return [...map.values()]
    .sort((a, b) => a.packages.length - b.packages.length)
})

const cols = computed(() => {
  const cols: {
    info: ResolvedFunding
    packages: PackageNode[]
  }[][] = [
    [],
    [],
  ]
  fundingGroup.value.forEach((group, idx) => {
    cols[idx % 2].push(group)
  })
  return cols
})
</script>

<template>
  <ReportExpendableContainer
    :list="[]"
    title="Funding"
  >
    <div op50>
      The following packages you use are asking for funding. Consider supporting them to help them sustainable.
      <div i-ph-heart-duotone text-pink inline-block />
    </div>
    <div grid="~ cols-2 gap-4">
      <div v-for="items, idx of cols" :key="idx">
        <div v-for="pkgs of items" :key="pkgs.info.url">
          <div>
            <div font-mono mt3 border="x t rounded-t-lg base" w-max p1 px3>
              <DisplayFundingEntry :funding="pkgs.info.url">
                <DisplayNumberBadge :number="pkgs.packages.length" rounded-full text-sm />
              </DisplayFundingEntry>
            </div>
            <ReportExpendableContainer :list="pkgs.packages" container-class="rounded-lt-none">
              <template #default="{ items }">
                <div flex="~ col gap-x-4 gap-y-1">
                  <template v-for="pkg of items" :key="pkg.spec">
                    <button
                      font-mono text-left hover:bg-active px2 ml--2 rounded
                      flex="~ gap-2 items-center"
                      @click="selectedNode = pkg"
                    >
                      <TreeItem :pkg :show-source-type="true" />
                    </button>
                  </template>
                </div>
              </template>
            </ReportExpendableContainer>
          </div>
        </div>
      </div>
    </div>
  </ReportExpendableContainer>
</template>

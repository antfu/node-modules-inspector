<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { ParsedFunding } from 'node-modules-tools/utils'
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import { getFundings } from '../../utils/package-json'

const fundingGroup = computed(() => {
  const map = new Map<string, {
    info: ParsedFunding
    packages: PackageNode[]
  }>()
  for (const pkg of payloads.filtered.packages) {
    if (pkg.workspace)
      continue

    const fundings = getFundings(pkg)
    for (const funding of fundings || []) {
      const group = map.get(funding.entry) ?? {
        info: funding,
        packages: [],
      }
      group.packages.push(pkg)
      map.set(funding.entry, group)
    }
  }
  return [...map.values()]
    .sort((a, b) => a.packages.length - b.packages.length || a.info.name.localeCompare(b.info.name))
})

const cols = computed(() => {
  const cols: {
    info: ParsedFunding
    packages: PackageNode[]
  }[][] = [
    [],
    [],
    [],
  ]
  fundingGroup.value.forEach((group, idx) => {
    cols[idx % 3]?.push(group)
  })
  return cols
})
</script>

<template>
  <template v-if="fundingGroup.length">
    <UiSubTitle>
      Funding
      <DisplayNumberBadge :number="fundingGroup.length" rounded-full text-sm />
    </UiSubTitle>
    <div op-fade>
      The following packages you use are requesting funding. Consider supporting them to help keep them sustainable.
    </div>
    <div grid="~ cols-3 gap-4" mt4>
      <div v-for="packages, idx of cols" :key="idx">
        <div v-for="pkgs of packages" :key="pkgs.info.url">
          <div>
            <div font-mono mt3 border="x t rounded-t-lg base" w-max bg-base of-hidden>
              <DisplayFundingEntry :funding="pkgs.info" p1 px3 hover="bg-pink/5 text-pink" transition>
                <DisplayNumberBadge :number="pkgs.packages.length" rounded-full text-sm />
              </DisplayFundingEntry>
            </div>
            <ReportExpendableContainer :list="pkgs.packages" container-class="rounded-lt-none">
              <template #default="{ items }">
                <div flex="~ col gap-x-4 gap-y-1">
                  <template v-for="pkg of items" :key="pkg.spec">
                    <button
                      font-mono text-left px2 ml--2 rounded
                      @click="selectedNode = pkg"
                    >
                      <TreeItem w-full :pkg :show-source-type="true" :show-module-type="false" />
                    </button>
                  </template>
                </div>
              </template>
            </ReportExpendableContainer>
          </div>
        </div>
      </div>
    </div>
  </template>
  <template v-else>
    <UiEmptyState
      type="info"
      title="No Funding Requests"
      message="None of your packages are requesting funding"
    />
  </template>
</template>

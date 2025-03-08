<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { ResolvedFunding } from '../../utils/funding'
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'
import { parseFunding } from '../../utils/funding'

const fundingGroup = computed(() => {
  const map = new Map<string, {
    info: ResolvedFunding
    packages: PackageNode[]
  }>()
  for (const pkg of payloads.filtered.packages) {
    if (pkg.workspace)
      continue

    for (const funding of pkg.resolved.fundings || []) {
      const resolved = parseFunding(funding.url)
      if (!resolved)
        continue
      const group = map.get(resolved.entry) ?? {
        info: resolved,
        packages: [],
      }
      group.packages.push(pkg)
      map.set(resolved.entry, group)
    }
  }
  return [...map.values()]
    .sort((a, b) => a.packages.length - b.packages.length || a.info.name.localeCompare(b.info.name))
})

const cols = computed(() => {
  const cols: {
    info: ResolvedFunding
    packages: PackageNode[]
  }[][] = [
    [],
    [],
    [],
  ]
  fundingGroup.value.forEach((group, idx) => {
    cols[idx % 3].push(group)
  })
  return cols
})
</script>

<template>
  <UiSubTitle>
    Funding
    <DisplayNumberBadge v-if="fundingGroup.length" :number="fundingGroup.length" rounded-full text-sm />
  </UiSubTitle>
  <div op50>
    The following packages you use are requesting for funding. Consider supporting them to help them sustainable.
  </div>
  <div grid="~ cols-3 gap-4" mt4>
    <div v-for="packages, idx of cols" :key="idx">
      <div v-for="pkgs of packages" :key="pkgs.info.url">
        <div>
          <div font-mono mt3 border="x t rounded-t-lg base" w-max bg-base of-hidden>
            <DisplayFundingEntry :funding="pkgs.info.url" p1 px3 hover="bg-pink/5 text-pink" transition>
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

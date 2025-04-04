<script setup lang="ts">
import { DisplayDateBadge } from '#components'
import { computed } from 'vue'
import { selectedNode } from '../../state/current'
import { getNpmMetaLatest, getPublishTime, payloads } from '../../state/payload'

const packages = computed(() =>
  Array.from(payloads.filtered.packages)
    .filter(x => getPublishTime(x))
    .sort((a, b) => +getPublishTime(a)! - +getPublishTime(b)!),
)

const outdatedPackages = computed(() =>
  Array.from(payloads.filtered.packages)
    .map((pkg) => {
      const latest = getNpmMetaLatest(pkg)
      if (!latest || !latest.publishedAt)
        return false
      const publishedAt = getPublishTime(pkg)
      if (!publishedAt)
        return false
      const delta = +latest.publishedAt - +publishedAt
      if (delta <= 30 * 60 * 1000) // 30mins
        return false
      return {
        pkg,
        delta,
        publishedAt,
        latest,
      }
    })
    .filter(x => !!x)
    .sort((a, b) => b.delta - a.delta),
)
</script>

<template>
  <div>
    <ReportExpendableContainer
      v-if="packages.length"
      :list="packages"
      :title="['Oldest Packages', 'Newest Packages']"
    >
      <template #default="{ items }">
        <div grid="~ cols-[1fr_max-content] gap-x-4 gap-y-1">
          <div />
          <div text-sm op-fade text-right>
            Publish Time
          </div>

          <template v-for="pkg of items" :key="pkg.spec">
            <button
              font-mono text-left hover:bg-active px2 ml--2 rounded
              flex="~ gap-2 items-center"
              @click="selectedNode = pkg"
            >
              <DisplayModuleType :pkg />
              <DisplayPackageSpec :pkg />
            </button>
            <div flex justify-end>
              <DisplayDateBadge :pkg />
            </div>
          </template>
        </div>
      </template>
    </ReportExpendableContainer>

    <ReportExpendableContainer
      v-if="outdatedPackages.length"
      :list="outdatedPackages"
      :title="['Most Outdated Packages', 'Least Outdated Packages']"
    >
      <template #default="{ items }">
        <div grid="~ cols-[max-content_1fr_1fr_1fr_1fr_max-content] gap-x-4 gap-y-1">
          <div />
          <div text-sm op-fade text-right>
            Current
          </div>
          <div text-sm op-fade>
            Published
          </div>
          <div text-sm op-fade text-right>
            Latest
          </div>
          <div text-sm op-fade>
            Lastest Publish
          </div>
          <div text-sm op-fade>
            In Between
          </div>

          <template v-for="{ pkg, latest, delta, publishedAt } of items" :key="pkg.spec">
            <button
              font-mono text-left hover:bg-active px2 ml--2 rounded
              flex="~ gap-2 items-center"
              @click="selectedNode = pkg"
            >
              <DisplayPackageName :name="pkg.name" />
            </button>
            <DisplayVersion :version="pkg.version" text-right />
            <div flex>
              <DisplayDateBadge :time="publishedAt" />
            </div>
            <DisplayVersion :version="latest.version" text-right />
            <div flex>
              <DisplayDateBadge :time="latest.publishedAt" />
            </div>
            <div flex justify-end>
              <DisplayDurationBadge :ms="delta" />
            </div>
          </template>
        </div>
      </template>
    </ReportExpendableContainer>
  </div>
</template>

<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { computed, ref } from 'vue'
import { getPackageData } from '@/utils/package-json'
import { selectedNode } from '../../state/current'
import { payloads } from '../../state/payload'

const PERMISSIVE_LICENSES = [
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'UPL-1.0',
  'CC0-1.0',
  '0BSD',
]

const selected = ref<string[]>([])

const licensesGroup = computed(() => {
  const group = new Map<string, PackageNode[]>()
  for (const pkg of payloads.filtered.packages) {
    if (pkg.workspace)
      continue
    const key = getPackageData(pkg).license || '<Unspecified>'
    if (!group.has(key))
      group.set(key, [])
    group.get(key)!.push(pkg)
  }
  return [...group.entries()]
    .sort((a, b) => a[1].length - b[1].length)
})

function toggleSelected(name: string) {
  if (selected.value.includes(name))
    selected.value = selected.value.filter(x => x !== name)
  else
    selected.value.push(name)
}

function selectPermissive() {
  selected.value = licensesGroup.value
    .filter(([name]) => PERMISSIVE_LICENSES.includes(name))
    .map(([name]) => name)
}

function selectNonPermissive() {
  selected.value = licensesGroup.value
    .filter(([name]) => !PERMISSIVE_LICENSES.includes(name))
    .map(([name]) => name)
}

function toggleAll() {
  if (selected.value.length === 0)
    selected.value = licensesGroup.value.map(([name]) => name)
  else
    selected.value = []
}

const filteredResult = computed(() => {
  return licensesGroup.value.filter(([name]) => selected.value.includes(name))
    .flatMap(([_, pkgs]) => pkgs)
})
</script>

<template>
  <template v-if="licensesGroup.length">
    <ReportExpendableContainer
      :list="[]"
      title="Licenses"
    >
      <div grid="~ cols-2 gap-4">
        <div>
          <div pb4 pt1 flex="~ gap-2 items-center">
            <button btn-action @click="toggleAll()">
              {{ selected.length === 0 ? 'Select All' : 'Unselect All' }}
            </button>
            <button btn-action @click="selectPermissive()">
              Permissive Licenses
            </button>
            <button btn-action @click="selectNonPermissive()">
              Other Licenses
            </button>
          </div>
          <div flex="~ col gap-y-1">
            <template v-for="group of licensesGroup" :key="group[0]">
              <button
                text-left hover:bg-active px2 ml--2 rounded
                flex="~ gap-2 items-center"
                :class="{ 'text-primary': selected.includes(group[0]) }"
                @click="toggleSelected(group[0])"
              >
                <OptionCheckbox :model-value="selected.includes(group[0])" pointer-events-none />
                <span>{{ group[0] }}</span>
                <DisplayNumberBadge :number="group[1].length" rounded-full text-sm w-max mra />
                <a
                  v-if="PERMISSIVE_LICENSES.includes(group[0])"
                  href="https://en.wikipedia.org/wiki/Permissive_software_license" target="_blank"
                  badge-color-green text-xs px1.5 py0.5 rounded
                >
                  Permissive
                </a>
              </button>
            </template>
          </div>
        </div>
        <div border="l base" pl4>
          <div v-if="!filteredResult.length" text-center py10 px5 op-fade italic>
            Select licenses on the left to show packages
          </div>
          <div v-else grid="~ cols-[max-content_max-content_1fr] gap-x-4 gap-y-1 items-center">
            <div text-sm op-fade text-center>
              License
            </div>
            <div text-sm op-fade text-center>
              Source
            </div>
            <div />
            <template v-for="pkg of filteredResult" :key="pkg.spec">
              <a
                :href="`https://www.npmjs.com/package/${pkg.name}/v/${pkg.version}`"
                target="_blank"
                badge-color-gray px2 rounded-full w-max text-sm h-max
              >
                {{ getPackageData(pkg).license }}
              </a>
              <div w-max>
                <DisplaySourceTypeBadge :pkg mode="both" />
              </div>
              <button
                font-mono text-left hover:bg-active px2 ml--2 rounded
                @click="selectedNode = pkg"
              >
                <DisplayPackageSpec :pkg />
              </button>
            </template>
          </div>
        </div>
      </div>
    </ReportExpendableContainer>
  </template>
  <template v-else>
    <UiEmptyState
      title="No License Information"
      message="No license information found for packages"
    />
  </template>
</template>

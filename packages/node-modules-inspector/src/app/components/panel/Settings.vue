<script setup lang="ts">
import { getBackend } from '../../backends'
import { fetchData } from '../../state/data'
import { settings } from '../../state/settings'

const backend = getBackend()
</script>

<template>
  <div>
    <div flex="~ col gap-2" p4>
      <OptionItem :div="true" title="Simplify module types" description="Show only ESM/CJS">
        <FormCheckbox v-model="settings.moduleTypeSimple" />
      </OptionItem>
      <OptionItem :div="true" title="Treat FAUX as ESM" description="Treat FAUX as ESM">
        <FormCheckbox v-model="settings.treatFauxAsESM" />
      </OptionItem>
      <OptionItem title="Module type indicator" description="Rendering mode of module type indicator">
        <OptionSelectGroup
          v-model="settings.moduleTypeRender"
          :options="['badge', 'circle', 'none']"
          :titles="['Badge', 'Circle', 'None']"
        />
      </OptionItem>
      <OptionItem :div="true" title="Show size badge" description="Show install size badge on package list">
        <FormCheckbox v-model="settings.showInstallSizeBadge" />
      </OptionItem>
      <OptionItem :div="true" title="Show publish time badge" description="Show publish time badge on package list">
        <FormCheckbox v-model="settings.showPublishTimeBadge" />
      </OptionItem>
      <OptionItem title="Provenance badge" description="Show provenance indicator on packages">
        <OptionSelectGroup
          v-model="settings.showProvenanceBadge"
          :options="['present', 'absent', 'none']"
          :titles="['Present', 'Absent', 'None']"
        />
      </OptionItem>
      <OptionItem :div="true" title="Colorize size badge" description="Colorize package size badge">
        <FormCheckbox v-model="settings.colorizePackageSize" />
      </OptionItem>
      <OptionItem :div="true" title="Animate chart" description="Animate chart">
        <FormCheckbox v-model="settings.chartAnimation" />
      </OptionItem>
      <OptionItem title="Dependency source badge" description="Show a badge of the source type">
        <OptionSelectGroup
          v-model="settings.showDependencySourceBadge"
          :options="['none', 'prod', 'dev', 'both']"
          :titles="['None', 'Prod', 'Dev', 'Both']"
        />
      </OptionItem>
      <OptionItem :div="true" title="Prefer npmx.dev" description="Use npmx.dev instead of npmjs.com for links">
        <FormCheckbox v-model="settings.preferNpmx" />
      </OptionItem>
    </div>

    <PanelFiltersOptionExcludes />

    <div v-if="backend.isDynamic" border="t base" p4 flex="~ gap-2 items-center">
      <button btn-action @click="fetchData(true)">
        <div i-ph-arrows-clockwise-duotone />
        Refetch Data
      </button>
    </div>
  </div>
</template>

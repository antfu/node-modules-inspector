<script setup lang="ts">
import { settings } from '~/state/settings'
</script>

<template>
  <div flex="~ col gap-4" p4>
    <OptionItem title="Simplify Module Types" description="Show only ESM/CJS">
      <OptionCheckbox v-model="settings.moduleTypeSimple" />
    </OptionItem>
    <OptionItem title="Module Type Indicator" description="Rendering mode of module type indicator">
      <OptionSelectGroup
        v-model="settings.moduleTypeRender"
        :options="['badge', 'circle', 'none']"
        :titles="['Badge', 'Circle', 'None']"
      />
    </OptionItem>
    <OptionItem title="Show Install Size Badge" description="Show install size badge on package list">
      <OptionCheckbox v-model="settings.showInstallSizeBadge" />
    </OptionItem>
    <OptionItem title="Colorize Package Size" description="Colorize package size badge">
      <OptionCheckbox v-model="settings.colorizePackageSize" />
    </OptionItem>
  </div>
</template>

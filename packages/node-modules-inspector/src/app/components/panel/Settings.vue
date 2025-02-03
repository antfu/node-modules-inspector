<script setup lang="ts">
import { settings } from '~/state/settings'
</script>

<template>
  <div flex="~ col gap-4" p4>
    <OptionItem title="Simplify module types" description="Show only ESM/CJS">
      <OptionCheckbox v-model="settings.moduleTypeSimple" />
    </OptionItem>
    <OptionItem title="Module type as dots" description="Render module type as dots without text">
      <OptionCheckbox v-model="settings.moduleTypeDot" />
    </OptionItem>
    <OptionItem title="Hide module type badges" description="Hide the module type badges">
      <OptionCheckbox v-model="settings.moduleTypeHide" />
    </OptionItem>
  </div>
</template>

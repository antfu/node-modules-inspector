<script setup lang="ts">
import { settings } from '~/state/settings'
</script>

<template>
  <div p5 flex="~ col gap-2">
    <h1 text-lg>
      Settings
    </h1>
    <div flex="~ col gap-2">
      <OptionItem title="Simplify module types" description="Show only ESM/CJS">
        <OptionCheckbox v-model="settings.moduleTypeSimple" />
      </OptionItem>
    </div>
  </div>
</template>

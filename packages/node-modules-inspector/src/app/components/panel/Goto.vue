<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import { ref, useTemplateRef } from 'vue'
import { selectedNode } from '~/state/current'

const input = ref('')

const el = useTemplateRef<HTMLInputElement>('el')
function onCommitted(node: PackageNode) {
  selectedNode.value = node
  input.value = ''
  el.value?.blur()
}
</script>

<template>
  <div
    bg-glass rounded-full border border-base
    shadow transition-all duration-300 h-12 relative
    focus-within="ring-4 ring-primary:20 w-60"
    :class="input ? 'border-primary w-60' : 'w-12'"
  >
    <OptionPackageSelect v-model:input="input" @select="onCommitted">
      <template #default="{ onEnter }">
        <label
          p3 flex-none rounded-full h-full
          flex="~ items-center gap-1.5"
          hover:bg-active
        >
          <div i-ph-magnifying-glass-duotone text-lg :class="input ? 'text-primary' : 'op50'" flex-none />
          <input
            ref="el"
            v-model="input"
            placeholder="Goto"
            w-full bg-transparent outline-none
            @keydown="onEnter"
          >
          <button
            w-6 h-6 rounded-full hover:bg-active flex
            :class="input ? '' : 'op0'"
            @click="input = ''"
          >
            <div i-ph-x ma op50 />
          </button>
        </label>
      </template>
    </OptionPackageSelect>
  </div>
</template>

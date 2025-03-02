<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { ComputedPayload } from '~/state/payload'
import { ref } from 'vue'

defineProps<{
  payload?: ComputedPayload
  excludes?: PackageNode[]
}>()

const selected = defineModel('selected', { default: new Set<PackageNode>() })

const input = ref('')

function onCommitted(node: PackageNode) {
  selected.value.add(node)
  input.value = ''
}
</script>

<template>
  <div relative w-100>
    <div
      h-12 border="~ base rounded-full" bg-glass shadow transition-all duration-300
    >
      <OptionPackageSelect v-model:input="input" :excludes :payload @select="onCommitted">
        <template #default="{ onEnter }">
          <label
            p3 flex-none rounded-full h-full
            flex="~ items-center gap-1.5"
            hover:bg-active
          >
            <slot name="icon" />
            <input
              v-model="input"
              placeholder="Select package"
              w-full bg-transparent outline-none
              class="placeholder:text-#8886"
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

    <div mt5>
      <div
        v-for="pkg of selected"
        :key="pkg.spec"
        flex="~ gap-2 items-center" p2
      >
        <TreeItem :pkg="pkg" flex-auto :show-module-type="false" />
        <button
          flex-none op50 rounded-full p1 hover="op100 bg-active"
          @click="selected.delete(pkg)"
        >
          <div i-ph-x />
        </button>
      </div>
    </div>
  </div>
</template>

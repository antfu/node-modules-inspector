<script setup lang="ts">
import Fuse from 'fuse.js'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { selectedNode } from '~/state/current'
import { payloads } from '~/state/payload'

const input = ref('')
const selectIndex = ref(0)

const fuse = computed(() => new Fuse(payloads.avaliable.packages, {
  keys: [
    'name',
    'spec',
    'author',
    'license',
  ],
}))

watch(input, () => {
  selectIndex.value = 0
})

const result = computed(() => {
  if (!input.value.trim())
    return []
  const result = fuse.value.search(input.value.trim())
  return result.map(i => i.item)
    .slice(0, 10)
})

const el = useTemplateRef<HTMLInputElement>('el')
function onCommitted() {
  input.value = ''
  el.value?.blur()
}

function onEnter(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown': {
      e.preventDefault()
      selectIndex.value = Math.min(selectIndex.value + 1, result.value.length - 1)
      break
    }
    case 'ArrowUp': {
      e.preventDefault()
      selectIndex.value = Math.max(selectIndex.value - 1, 0)
      break
    }
    case 'Enter': {
      e.preventDefault()
      const item = result.value[selectIndex.value]
      if (item) {
        selectedNode.value = item
        onCommitted()
      }
      break
    }
  }
}
</script>

<template>
  <div
    bg-glass rounded-full border border-base
    shadow transition-all duration-300 h-12 relative
    focus-within="ring-4 ring-primary:20 w-60"
    :class="input ? 'border-primary w-60' : 'w-12'"
  >
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
  </div>
  <Teleport to="body">
    <div
      v-show="result.length"
      fixed left-72 top-20 p2 bg-glass shadow rounded-xl z-panel-goto
      border="~ base"
      flex="~ col"
    >
      <template v-for="pkg, idx of result" :key="pkg.spec">
        <PackageInfoList
          :pkg
          p2 w-full
          :class="idx === selectIndex ? 'bg-active' : ''"
          @click="onCommitted()"
        />
      </template>
    </div>
  </Teleport>
</template>

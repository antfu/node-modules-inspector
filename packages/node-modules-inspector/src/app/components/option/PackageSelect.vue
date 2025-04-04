<script setup lang="ts">
import type { PackageNode } from 'node-modules-tools'
import type { ComputedPayload } from '../../state/payload'
import { Menu as VMenu } from 'floating-vue'
import Fuse from 'fuse.js'
import { computed, ref, watch } from 'vue'
import { payloads } from '../../state/payload'

const props = withDefaults(
  defineProps<{
    payload?: ComputedPayload
    excludes?: PackageNode[]
  }>(),
  {
    payload: payloads.avaliable as any,
  },
)

const emit = defineEmits<{
  select: [node: PackageNode]
}>()

const input = defineModel<string>('input', { default: '' })

const selectIndex = ref(0)

const fuse = computed(() => new Fuse(props.payload.packages, {
  keys: [
    'name',
    'spec',
    'resolved.packageJson.author',
    'resolved.packageJson.authors',
    'resolved.packageJson.funding',
    'resolved.packageJson.fundings',
    'resolved.packageJson.license',
    'resolved.packageJson.license.type',
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
    .filter(x => !props.excludes?.includes(x))
    .slice(0, 10)
})

function commit() {
  const item = result.value[selectIndex.value]
  if (item) {
    emit('select', item)
    input.value = ''
  }
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
      commit()
      break
    }
  }
}
</script>

<template>
  <VMenu :triggers="[]" :shown="!!result.length" :auto-hide="false" placement="bottom-start">
    <slot :on-enter="onEnter" :commit />
    <template #popper>
      <div
        v-if="result.length"
        p2 flex="~ col" w-100
      >
        <template v-for="pkg, idx of result" :key="pkg.spec">
          <TreeItem
            :pkg
            p2 w-full
            :class="idx === selectIndex ? 'bg-active' : ''"
            @click="commit()"
          />
        </template>
      </div>
    </template>
  </VMenu>
</template>

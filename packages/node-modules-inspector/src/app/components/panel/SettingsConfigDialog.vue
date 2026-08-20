<script setup lang="ts">
import OverlayModal from '@antfu/design/components/Overlay/OverlayModal.vue'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { generateConfigFile } from '../../utils/config'

const open = defineModel<boolean>('open', { required: true })

const CONFIG_FILENAME = 'node-modules-inspector.config.ts'

const content = computed(() => (open.value ? generateConfigFile() : ''))

const { copy, copied } = useClipboard({ source: content, copiedDuring: 1500 })

function download() {
  const blob = new Blob([content.value], { type: 'text/typescript;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = CONFIG_FILENAME
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <OverlayModal v-model:open="open" title="Save as config file" class="max-w-3xl! max-h-90vh of-y-auto">
    <p text-sm op-fade mb3>
      Save the following as
      <code color-active bg-primary:10 rounded px1 py0.5>{{ CONFIG_FILENAME }}</code>
      in your project root to reuse the current filters and settings as defaults.
    </p>
    <pre
      text-xs p3 rounded-lg border="~ base" bg-code
      of-x-auto whitespace-pre font-mono
    >{{ content }}</pre>
    <template #footer>
      <button
        btn-action text-sm
        :class="copied ? 'text-primary' : ''"
        @click="copy()"
      >
        <div :class="copied ? 'i-ph-check' : 'i-ph-copy-duotone'" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
      <button
        btn-action text-sm
        @click="download()"
      >
        <div i-ph-download-simple-duotone />
        Download
      </button>
    </template>
  </OverlayModal>
</template>

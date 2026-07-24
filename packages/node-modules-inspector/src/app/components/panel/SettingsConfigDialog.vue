<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { generateConfigFile } from '../../utils/config'

const open = defineModel<boolean>({ required: true })

const CONFIG_FILENAME = 'node-modules-inspector.config.ts'

const content = computed(() => (open.value ? generateConfigFile() : ''))

const { copy, copied } = useClipboard({ source: content, copiedDuring: 1500 })

function close() {
  open.value = false
}

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
  <Teleport to="body">
    <Transition name="config-dialog-backdrop">
      <div
        v-if="open"
        fixed inset-0 z-drawer-backdrop bg-black:30
        @click="close"
      />
    </Transition>
    <Transition name="config-dialog-panel">
      <div
        v-if="open"
        fixed inset-0 z-drawer-content
        flex="~ items-center justify-center" p4
        pointer-events-none
      >
        <div
          w-full max-w-3xl max-h-90vh
          bg-base border="~ base" rounded-lg shadow-2xl
          flex="~ col" of-hidden pointer-events-auto
          @click.stop
        >
          <div flex="~ items-center gap-2" border="b base" px4 py3>
            <div i-ph-file-code-duotone text-lg op75 />
            <div flex="~ col" flex-auto>
              <div font-500>
                Save as config file
              </div>
            </div>
            <button
              w-8 h-8 rounded-full op50 flex="~ items-center justify-center"
              hover="op100 bg-active"
              title="Close"
              @click="close"
            >
              <div i-ph-x />
            </button>
          </div>

          <div flex-auto of-y-auto p4>
            <p text-sm op-fade mb3>
              Save the following as
              <code color-active bg-primary:10 rounded px1 py0.5>{{ CONFIG_FILENAME }}</code>
              in your project root to reuse the current filters and settings as defaults.
            </p>
            <pre
              text-xs p3 rounded-lg border="~ base" bg-code
              of-x-auto whitespace-pre font-mono
            >{{ content }}</pre>
          </div>

          <div flex="~ items-center justify-end gap-2" border="t base" px4 py3>
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
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.config-dialog-backdrop-enter-active,
.config-dialog-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.config-dialog-backdrop-enter-from,
.config-dialog-backdrop-leave-to {
  opacity: 0;
}

.config-dialog-panel-enter-active,
.config-dialog-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.config-dialog-panel-enter-from,
.config-dialog-panel-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>

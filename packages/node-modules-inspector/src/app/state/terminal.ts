import type { Terminal } from '@xterm/xterm'
import { useLocalStorage } from '@vueuse/core'
import { shallowRef } from 'vue'

export const terminal = shallowRef<Terminal>()
export const openTerminal = useLocalStorage<boolean>('node-inspector-terminal', false)
export const showTerminal = shallowRef(false)

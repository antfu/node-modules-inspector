import type { Backend } from '../types/backend'
import { shallowRef } from 'vue'

export const backend = shallowRef<Backend>()

export function getBackend() {
  return backend.value!
}

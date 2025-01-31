import { useDark } from '@vueuse/core'

export const isDark = useDark()

export function toggleDark() {
  isDark.value = !isDark.value
}

import { useDark } from '@vueuse/core'

export const isDark = useDark({
  valueLight: 'light',
})

export function toggleDark() {
  isDark.value = !isDark.value
}

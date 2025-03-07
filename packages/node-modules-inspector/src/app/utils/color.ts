import { isDark } from '../composables/dark'

export function getHashColorFromString(
  name: string,
  opacity: number | string = 1,
) {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const h = hash % 360
  return getHsla(h, opacity)
}

export function getHsla(
  hue: number,
  opacity: number | string = 1,
) {
  const saturation = isDark.value ? 50 : 65
  const lightness = isDark.value ? 60 : 40
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`
}

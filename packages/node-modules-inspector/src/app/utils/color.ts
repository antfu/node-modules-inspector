import Color from 'colorjs.io'
import { isDark } from '../composables/dark'

export function getHashColorFromString(
  name: string,
  opacity: number | string = 1,
) {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const h = ((hash % 360) + 360) % 360
  return getHsla(h, opacity)
}

// Named `getHsla` for backwards compatibility, but renders OKLCH, not HSL.
// HSL's lightness isn't perceptually uniform across hues — a fixed L=40%
// looks near-black for blue/purple but near-white for yellow/green, so the
// old `hsla(hue, 65%, 40%)` formula swung from ~7.7:1 down to ~2:1 contrast
// against the page background depending purely on hue (axe-core-measured on
// ClusterBadge cluster-name tooltips). OKLCH's L is roughly perceptually
// uniform, so a single L holds ~7:1+ minimum contrast across the full hue
// wheel in both modes.
export function getHsla(
  hue: number,
  opacity: number | string = 1,
) {
  const lightness = isDark.value ? 0.75 : 0.42
  const chroma = 0.15
  return new Color('oklch', [lightness, chroma, hue], Number(opacity)).toString({ precision: 4 })
}

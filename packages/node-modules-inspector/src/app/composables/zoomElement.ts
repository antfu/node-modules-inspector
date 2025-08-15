import type { MaybeElementRef } from '@vueuse/core'
import type { MaybeRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import { ref, toValue } from 'vue'

export function useZoomElement(
  target: MaybeElementRef<HTMLElement | null>,
  {
    wheel = true,
    minScale = 0.5,
    maxScale = 2,
  }: {
    wheel?: MaybeRef<boolean>
    minScale?: number
    maxScale?: number
  } = {},
) {
  const scale = ref(1)

  function zoom(factor: number, clientX?: number, clientY?: number) {
    const el = toValue(target)
    if (!el)
      return

    const { left, top, width, height } = el.getBoundingClientRect()

    // default to center
    const x = clientX ?? (left + width / 2)
    const y = clientY ?? (top + height / 2)

    const offsetX = x - left
    const offsetY = y - top
    const oldScale = scale.value

    scale.value = Math.max(minScale, Math.min(maxScale, oldScale + factor))

    const ratio = scale.value / oldScale

    // Adjust scroll so that the zoom center is kept in place
    el.scrollLeft = (el.scrollLeft + offsetX) * ratio - offsetX
    el.scrollTop = (el.scrollTop + offsetY) * ratio - offsetY
  }

  function handleWheel(event: WheelEvent) {
    if (toValue(wheel)) {
      // Use control + wheel
      event.preventDefault()

      const zoomFactor = 0.2
      zoom(event.deltaY < 0 ? zoomFactor : zoomFactor * -1, event.clientX, event.clientY)
    }
    else if (event.ctrlKey) {
      // Use touchpad zoom
      event.preventDefault()

      const zoomFactor = 0.004
      zoom(event.deltaY * zoomFactor * -1, event.clientX, event.clientY)
    }
  }

  function zoomIn(factor = 0.2) {
    zoom(factor)
  }

  function zoomOut(factor = 0.2) {
    zoom(factor * -1)
  }

  useEventListener(target, 'wheel', handleWheel)

  return { scale, zoom, zoomIn, zoomOut }
}

import type { MaybeElementRef } from '@vueuse/core'
import type { MaybeRef } from 'vue'
import { useEventListener } from '@vueuse/core'
import { ref, toValue } from 'vue'

export function useWheelZoom(target: MaybeElementRef<HTMLElement | null>, active: MaybeRef<boolean> = true) {
  const scale = ref(1)

  function handleZoom(event: WheelEvent) {
    if (!toValue(active))
      return

    event.preventDefault()

    const _target = toValue(target)
    if (!_target)
      return

    const { left, top } = _target.getBoundingClientRect()
    const offsetX = event.clientX - left
    const offsetY = event.clientY - top
    const oldScale = scale.value

    const zoomFactor = 0.1
    if (event.deltaY > 0) {
      scale.value = Math.min(oldScale + zoomFactor, 3)
    }
    else {
      scale.value = Math.max(oldScale - zoomFactor, 0.5)
    }

    const ratio = scale.value / oldScale
    _target.scrollLeft = (_target.scrollLeft + offsetX) * ratio - offsetX
    _target.scrollTop = (_target.scrollTop + offsetY) * ratio - offsetY
  }

  useEventListener(target, 'wheel', handleZoom)

  return { scale }
}

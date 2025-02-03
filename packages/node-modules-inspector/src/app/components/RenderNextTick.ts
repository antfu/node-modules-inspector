import { defineComponent, ref, renderSlot } from 'vue'

export default defineComponent({
  name: 'RenderNextTick',
  setup(_, { slots }) {
    const render = ref(false)

    setTimeout(() => {
      render.value = true
    }, 0)

    return () => render.value
      ? renderSlot(slots, 'default')
      : renderSlot(slots, 'fallback')
  },
})

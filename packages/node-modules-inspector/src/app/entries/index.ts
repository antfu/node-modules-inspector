import { defineAsyncComponent } from 'vue'

export default defineAsyncComponent(() => {
  if (import.meta.env.BACKEND === 'web')
    return import('./web.vue')
  else
    return import('./dev.vue')
})

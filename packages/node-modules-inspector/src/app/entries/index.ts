import { defineAsyncComponent } from 'vue'

export default defineAsyncComponent(() => {
  if (import.meta.env.BACKEND === 'webcontainer')
    return import('./webcontainer.vue')
  else
    return import('./main.vue')
})

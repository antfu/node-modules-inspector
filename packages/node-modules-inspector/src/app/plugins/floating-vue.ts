import FloatingVue from 'floating-vue'
import { defineNuxtPlugin } from '#app/nuxt'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(FloatingVue, {
    overflowPadding: 20,
  })
})

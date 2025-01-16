import { defineNuxtPlugin } from '#app/nuxt'
import FloatingVue from 'floating-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(FloatingVue, {
    overflowPadding: 20,
  })
})

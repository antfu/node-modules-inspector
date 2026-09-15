import VueAfloat from 'vue-afloat'
import { defineNuxtPlugin } from '#app/nuxt'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueAfloat, {
    overflowPadding: 20,
  })
})

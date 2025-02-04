import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxt/eslint',
    'nuxt-eslint-auto-explicit-import',
  ],

  alias: {
    'node-modules-tools': fileURLToPath(new URL('../../node-modules-tools/src/index.ts', import.meta.url)),
  },

  logLevel: 'verbose',
  srcDir: 'app',

  eslint: {
    config: {
      standalone: false,
    },
  },

  experimental: {
    typedPages: true,
    clientNodeCompat: true,
  },

  features: {
    inlineStyles: false,
  },

  css: [
    '@unocss/reset/tailwind.css',
  ],

  nitro: {
    preset: 'static',
    output: {
      dir: '../dist',
    },
    routeRules: {
      '/': {
        prerender: true,
      },
      '/200.html': {
        prerender: true,
      },
      '/404.html': {
        prerender: true,
      },
      '/*': {
        prerender: false,
      },
    },
    sourceMap: false,
  },

  app: {
    baseURL: './',
    head: {
      viewport: 'width=device-width,initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `/favicon.svg` },
      ],
      htmlAttrs: {
        class: 'bg-dots',
      },
    },
  },

  vite: {
    base: './',
  },

  devtools: {
    enabled: false,
  },

  typescript: {
    includeWorkspace: true,
  },

  compatibilityDate: '2024-07-17',
})

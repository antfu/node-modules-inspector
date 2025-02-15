import process from 'node:process'
import { fileURLToPath } from 'node:url'
import Inspect from 'vite-plugin-inspect'

const NUXT_DEBUG_BUILD = !!process.env.NUXT_DEBUG_BUILD
const backend = process.env.NMI_BACKEND ?? 'dev'
const isWebContainer = backend === 'webcontainer'

const headers = isWebContainer
  ? {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  : {}

export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxt/eslint',
    'nuxt-eslint-auto-explicit-import',
    ...isWebContainer ? ['./app/modules/webcontainer'] : [],
  ],

  alias: {
    'node-modules-tools/utils': fileURLToPath(new URL('../../node-modules-tools/src/utils.ts', import.meta.url)),
    'node-modules-tools': fileURLToPath(new URL('../../node-modules-tools/src/index.ts', import.meta.url)),
    'node-modules-inspector': fileURLToPath(new URL('../../node-modules-inspector/src/node/index.ts', import.meta.url)),
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
    minify: NUXT_DEBUG_BUILD ? false : undefined,
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
      '/**': {
        prerender: false,
        headers: {
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin',
        },
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
    define: {
      'import.meta.env.BACKEND': JSON.stringify(backend),
    },
    server: {
      headers,
    },
    build: {
      minify: NUXT_DEBUG_BUILD ? false : undefined,
      rollupOptions: {
        output: {
          entryFileNames: '_nuxt/[name].[hash].js',
          chunkFileNames: '_nuxt/chunks/[name].[hash].js',
          manualChunks: (id) => {
            if (id.includes('@webcontainer'))
              return 'webcontainer-vendor'
          },
        },
      },
    },
    plugins: [
      NUXT_DEBUG_BUILD ? Inspect({ build: true }) : null,
    ],
  },

  devtools: {
    enabled: false,
  },

  typescript: {
    includeWorkspace: true,
  },

  compatibilityDate: '2024-07-17',
})

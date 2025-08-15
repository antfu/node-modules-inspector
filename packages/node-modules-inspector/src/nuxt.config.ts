import process from 'node:process'
import { fileURLToPath } from 'node:url'
import Inspect from 'vite-plugin-inspect'

const NUXT_DEBUG_BUILD = !!process.env.NUXT_DEBUG_BUILD
const backend = process.env.NMI_BACKEND ?? 'dev'
const isWebContainer = backend === 'webcontainer'

const headers: Record<string, string> = isWebContainer
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
    'nuxt-mcp',
    ...isWebContainer ? ['./app/modules/webcontainer'] : [],
  ],

  alias: {
    'node-modules-tools/utils': fileURLToPath(new URL('../../node-modules-tools/src/utils.ts', import.meta.url)),
    'node-modules-tools/constants': fileURLToPath(new URL('../../node-modules-tools/src/constants.ts', import.meta.url)),
    'node-modules-tools': fileURLToPath(new URL('../../node-modules-tools/src/index.ts', import.meta.url)),
    'node-modules-inspector': fileURLToPath(new URL('../../node-modules-inspector/src/node/index.ts', import.meta.url)),
  },

  logLevel: 'verbose',
  srcDir: 'app',

  dir: {
    public: './app/public',
  },

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
        headers,
      },
    },
    sourceMap: false,
  },

  app: {
    baseURL: './',
    head: {
      title: 'Node Modules Inspector',
      charset: 'utf-8',
      viewport: 'width=device-width,initial-scale=1',
      meta: [
        { name: 'description', content: 'Visualize your node_modules, inspect dependencies, and more.' },
        { property: 'og:title', content: 'Node Modules Inspector' },
        { property: 'og:description', content: 'Visualize your node_modules, inspect dependencies, and more.' },
        { property: 'og:image', content: 'https://node-modules.dev/og.png' },
        { property: 'og:url', content: 'https://node-modules.dev' },
        { property: 'og:type', content: 'website' },
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:title', content: 'Node Modules Inspector' },
        { property: 'twitter:description', content: 'Visualize your node_modules, inspect dependencies, and more.' },
        { property: 'twitter:image', content: 'https://node-modules.dev/og.png' },
        { property: 'twitter:url', content: 'https://node-modules.dev' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `/favicon.svg` },
      ],
      htmlAttrs: {
        lang: 'en',
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
          advancedChunks: {
            groups: [
              {
                name: 'webcontainer-vendor',
                test: /@webcontainer/,
              },
            ],
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'fuse.js',
        'd3-hierarchy',
        'd3-shape',
        'modern-screenshot',
      ],
      exclude: [
        'structured-clone-es',
        'birpc',
      ],
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

  hooks: {
    'prepare:types': function ({ tsConfig }) {
      const aliasesToRemoveFromAutocomplete = ['~~', '~~/*', '~', '~/*']
      for (const alias of aliasesToRemoveFromAutocomplete) {
        if (tsConfig.compilerOptions?.paths[alias]) {
          delete tsConfig.compilerOptions.paths[alias]
        }
      }
    },
  },

  compatibilityDate: '2024-07-17',
})

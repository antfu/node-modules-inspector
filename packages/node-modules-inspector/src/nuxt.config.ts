import process from 'node:process'
import { fileURLToPath } from 'node:url'
import Inspect from 'vite-plugin-inspect'

const NUXT_DEBUG_BUILD = !!process.env.NUXT_DEBUG_BUILD
const backend = process.env.NMI_BACKEND ?? 'dev'
const isWeb = backend === 'web'

// The hosted web build ships the WebContainer-backed "Sandbox Install" mode,
// which requires cross-origin isolation (COOP/COEP) to boot.
const headers: Record<string, string> = isWeb
  ? {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  : {}

export default defineNuxtConfig({
  ssr: false,
  spaLoadingTemplate: false,

  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxt/eslint',
    'nuxt-eslint-auto-explicit-import',
    ...isWeb ? ['./app/modules/webcontainer'] : [],
  ],

  alias: {
    'node-modules-tools/registry': fileURLToPath(new URL('../../node-modules-tools/src/registry.ts', import.meta.url)),
    'node-modules-tools/utils': fileURLToPath(new URL('../../node-modules-tools/src/utils.ts', import.meta.url)),
    'node-modules-tools/constants': fileURLToPath(new URL('../../node-modules-tools/src/constants.ts', import.meta.url)),
    'node-modules-tools': fileURLToPath(new URL('../../node-modules-tools/src/index.ts', import.meta.url)),
    'node-modules-inspector': fileURLToPath(new URL('../../node-modules-inspector/src/node/index.ts', import.meta.url)),
  },

  logLevel: 'verbose',
  srcDir: 'app',

  components: {
    dirs: [
      // `@antfu/design` ships raw category-prefixed SFCs (DisplayDonut, FormCheckbox, …);
      // register them for auto-import so they resolve like local components.
      {
        path: fileURLToPath(new URL('../../../node_modules/@antfu/design/components', import.meta.url)),
        pathPrefix: false,
        extensions: ['vue'],
        ignore: [
          // These need optional peers (splitpanes, @tanstack/vue-virtual, dompurify) we don't use.
          '**/LayoutSplitPane.vue',
          '**/LayoutVirtualList.vue',
          '**/DisplayIconifyRemoteIcon.vue',
          // Intentionally shadowed: the app keeps its own (deprecated/vulnerable
          // coloring must inherit from context; the design one is self-colored).
          '**/DisplayPackageName.vue',
        ],
      },
      // Keep the default app components dir (registered last to win name conflicts).
      '~/components',
    ],
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

  future: {
    compatibilityVersion: 5,
  },

  features: {
    inlineStyles: false,
  },

  // `@antfu/design` ships raw `.ts`/`.vue`; transpile it in the build.
  build: {
    transpile: ['@antfu/design'],
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
    sourcemap: false,
  },

  app: {
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
        'floating-vue',
        '@antfu/utils',
        'verkit',
        'devframe/client',
        'publint/utils',
      ],
      exclude: [
        'structured-clone-es',
        'birpc',
        // Ships raw `.ts`/`.vue`; let Vite compile it in-place instead of prebundling.
        '@antfu/design',
      ],
    },
    plugins: [
      NUXT_DEBUG_BUILD ? Inspect({ build: true }) as any : undefined,
    ],
  },

  devtools: {
    enabled: true,
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

  compatibilityDate: '2026-05-29',
})

import type { Preset } from 'unocss'
import { fileURLToPath } from 'node:url'
import { presetAnthonyDesign } from '@antfu/design/unocss'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

// The project's WCAG-tuned green ramp (darkened 400 so text-primary /
// text-primary-400 clear WCAG AA on white). Kept verbatim from the prior config.
const primary = {
  50: '#E9F4E7',
  100: '#D2E8CF',
  200: '#A9D3A2',
  300: '#7CBC71',
  400: '#49833E',
  DEFAULT: '#49833E',
  500: '#3F7236',
  600: '#396831',
  700: '#2C5026',
  800: '#1D3419',
  900: '#0F1C0D',
  950: '#080E07',
}

export default defineConfig({
  shortcuts: [
    {
      // App-specific shortcuts not covered by `presetAnthonyDesign`.
      // The semantic tokens (color-base, bg-*, border-*, btn-action*, op-*,
      // color-scale-*, badge-color-*, bg-glass, …) now come from the preset.
      'icon-catppuccin': 'light:filter-invert-100 light:filter-hue-rotate-180 light:filter-brightness-80',

      'color-deprecated': 'text-op85 text-[#b71c1c] dark:text-[#f87171]',

      // Bespoke z-index ladder (overrides the preset's z-* where names collide).
      'z-graph-bg': 'z-5',
      'z-graph-link': 'z-10',
      'z-graph-node': 'z-11',
      'z-graph-link-active': 'z-12',
      'z-graph-node-active': 'z-13',

      'z-panel-content': 'z-50',
      'z-panel-no-mobile': 'z-55',
      'z-panel-nav': 'z-60',
      'z-panel-goto': 'z-70',
      'z-panel-terminal': 'z-80',
      'z-drawer-backdrop': 'z-85',
      'z-drawer-content': 'z-90',

      'page-padding': 'pt-24 pl-112 pr-8 pb-8',
      'page-padding-collapsed': 'pt-24 pl-14 pr-8 pb-8',
    },
  ],
  presets: [
    // Contributes the design layer: the primary/warning/success/error ramps,
    // the semantic shortcuts (color-base, bg-*, border-*, btn-*, badge*, op-*),
    // the color-scale-* severity layer and the bg-dots/bg-grid pattern rules.
    // Cast: the package bundles its own `@unocss/core`, so its `Preset` generic
    // is a distinct (structurally identical) type from this app's `unocss`.
    presetAnthonyDesign({ primary }) as unknown as Preset,
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans:200,400,700',
        mono: 'DM Mono',
      },
      processors: createLocalFontProcessor({
        fontAssetsDir: fileURLToPath(new URL('./app/public/fonts', import.meta.url)),
        fontServeBaseUrl: './fonts',
      }),
    }),
  ],
  content: {
    pipeline: {
      // Keep UnoCSS's default file scanning AND scan @antfu/design's components
      // (in node_modules) so their utility classes are generated. Providing
      // `include` replaces the default, so the default pattern is restated here.
      include: [
        /\.(vue|svelte|[jt]sx|vine\.ts|mdx?|astro|elm|php|phtml|marko|html)($|\?)/,
        /@antfu\/design\/.*\.(vue|ts|mjs|js)($|\?)/,
      ],
    },
  },
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

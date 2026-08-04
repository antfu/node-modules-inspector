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

export default defineConfig({
  shortcuts: [
    {
      // App-owned named z-index layers. The design preset ships no z-scale and
      // blocks plain `z-<number>` in markup, so every layer is defined here.
      'z-graph-bg': 'z-5',
      'z-graph-link': 'z-10',
      'z-graph-node': 'z-11',
      'z-graph-link-active': 'z-12',
      'z-graph-node-active': 'z-13',

      'z-loading': 'z-49',
      'z-panel-content': 'z-50',
      'z-panel-no-mobile': 'z-55',
      'z-panel-nav': 'z-60',
      'z-panel-goto': 'z-70',
      'z-panel-terminal': 'z-80',
      'z-drawer-backdrop': 'z-85',
      'z-drawer-content': 'z-90',
      'z-modal-backdrop': 'z-95',
      'z-modal-content': 'z-100',

      // App-specific tokens not covered by the design preset.
      // (icon-catppuccin now ships from @antfu/design >=0.3.0 — see unocss/shortcuts.ts)
      'color-deprecated': 'text-op85 text-[#b71c1c] dark:text-[#f87171]',

      'page-padding': 'pt-24 pl-112 pr-8 pb-8',
      'page-padding-collapsed': 'pt-24 pl-14 pr-8 pb-8',
    },
  ],
  presets: [
    // The design layer: semantic `*-base` tokens, `btn-*`/`badge*` shortcuts,
    // `badge-color-*`/`bg-glass` dynamics, the `color-scale-*` severity ramp and
    // the primary/warning/success/error theme scales (default antfu green). It
    // has no opinion on fonts — presetWebFonts below is the sole source of
    // truth for `font-sans`/`font-mono`, composed onto the base preset's own
    // fallback chain (see @antfu/design >=0.2.2).
    presetAnthonyDesign({
      overrides: {
        // `badge-color-*`'s light-mode text-700-on-bg-400/20 formula is
        // marginally below WCAG AA (4.5:1) for these hues specifically
        // (~4.4-4.8:1, axe-core-measured) — bump to the 800 shade, which
        // clears comfortably (~6.2-6.6:1) while staying in the same hue family.
        // `lime`/`teal` back module-type badges (FAUX/DUAL), so they hit real
        // pages, not just the palette safelist. Reported upstream; drop these
        // once a fixed @antfu/design ships.
        'badge-color-orange': 'bg-orange-400/20 dark:bg-orange-400/10 text-orange-800 dark:text-orange-300 border border-orange-600/15 dark:border-orange-300/15',
        'badge-color-yellow': 'bg-yellow-400/20 dark:bg-yellow-400/10 text-yellow-800 dark:text-yellow-300 border border-yellow-600/15 dark:border-yellow-300/15',
        'badge-color-green': 'bg-green-400/20 dark:bg-green-400/10 text-green-800 dark:text-green-300 border border-green-600/15 dark:border-green-300/15',
        'badge-color-lime': 'bg-lime-400/20 dark:bg-lime-400/10 text-lime-800 dark:text-lime-300 border border-lime-600/15 dark:border-lime-300/15',
        'badge-color-teal': 'bg-teal-400/20 dark:bg-teal-400/10 text-teal-800 dark:text-teal-300 border border-teal-600/15 dark:border-teal-300/15',
      },
    }),
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
  safelist: [
    'badge-color-amber',
    'badge-color-blue',
    'badge-color-cyan',
    'badge-color-gray',
    'badge-color-green',
    'badge-color-lime',
    'badge-color-orange',
    'badge-color-pink',
    'badge-color-purple',
    'badge-color-red',
    'badge-color-teal',
    'badge-color-yellow',
    'badge-color-primary',
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

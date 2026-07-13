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

      // App-specific tokens not covered by the design preset.
      'icon-catppuccin': 'light:filter-invert-100 light:filter-hue-rotate-180 light:filter-brightness-80',
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
    presetAnthonyDesign(),
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
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

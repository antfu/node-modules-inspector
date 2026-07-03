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
import { theme as wind3Theme } from 'unocss/preset-wind3'

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
    // the primary/warning/success/error theme scales (default antfu green).
    presetAnthonyDesign({
      // presetWebFonts below owns the brand fonts: it downloads DM Sans/DM Mono
      // and prepends them to the theme's fontFamily. Feed the design preset the
      // wind3 defaults so its own font merge is a no-op — its bare "DM Sans"
      // default would otherwise replace the stacks and drop the generic
      // fallbacks (serif flash when the webfont isn't loaded).
      fonts: {
        sans: wind3Theme.fontFamily!.sans,
        mono: wind3Theme.fontFamily!.mono,
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
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

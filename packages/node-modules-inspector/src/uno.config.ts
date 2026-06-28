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

      // The preset ships no z-index scale (stacking is the app's to own); this is
      // the app's bespoke named-layer ladder. Shortcut expansions are exempt from
      // the preset's plain-z blocklist.
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
    //
    // `plainZIndex: false` opts out of the preset's plain-`z-<number>` guardrail:
    // this app already owns a deliberate z-index system (the named ladder above
    // plus a few local, within-component z values), so the guardrail is redundant.
    //
    // Cast: resolved against a different `@unocss/core` instance than this app's
    // `unocss`, so the `Preset` generic is a distinct (structurally identical) type.
    presetAnthonyDesign({ primary, blocklists: { plainZIndex: false } }) as unknown as Preset,
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
  // `@antfu/design` requires the directives transformer — its shipped styles
  // recolor overlays via token `--at-apply` directives. No `content` override is
  // needed: UnoCSS's default scan already matches the package's `.vue` components.
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})

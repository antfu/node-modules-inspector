import { fileURLToPath } from 'node:url'
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
      'color-base': 'color-neutral-800 dark:color-neutral-300',
      'bg-base': 'bg-white dark:bg-#111',
      'bg-secondary': 'bg-#eee dark:bg-#222',
      'border-base': 'border-#8882',

      'bg-tooltip': 'bg-white:75 dark:bg-#111:75 backdrop-blur-8',
      'bg-code': 'bg-gray5:5',

      'bg-gradient-more': 'bg-gradient-to-t from-white via-white:80 to-white:0 dark:from-#111 dark:via-#111:80 dark:to-#111:0',

      'color-active': 'color-primary-600 dark:color-primary-300',
      'border-active': 'border-primary-600/25 dark:border-primary-400/25',
      'bg-active': 'bg-#8881',

      'btn-action': 'border border-base rounded flex gap-2 items-center px2 py1 op75 hover:op100 hover:bg-active disabled:pointer-events-none disabled:op30!',
      'btn-action-sm': 'btn-action text-sm',
      'btn-action-active': 'color-active border-active! bg-active op100!',

      'icon-catppuccin': 'light:filter-invert-100 light:filter-hue-rotate-180 light:filter-brightness-80',

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

      'op-fade': 'op65 dark:op55',
      'op-mute': 'op30 dark:op25',
      'color-deprecated': 'text-op85 text-[#b71c1c] dark:text-[#f87171]',

      'color-scale-neutral': 'text-gray7:75 dark:text-gray:75!',
      'color-scale-low': 'text-lime7:75 dark:text-lime:75! dark:saturate-50',
      'color-scale-medium': 'text-amber7:85 dark:text-amber:85! dark:saturate-80',
      'color-scale-high': 'text-orange7:95 dark:text-orange:95!',
      'color-scale-critical': 'text-red7:95 dark:text-red:95!',

      'page-padding': 'pt-24 pl-112 pr-8 pb-8',
      'page-padding-collapsed': 'pt-24 pl-14 pr-8 pb-8',
    },
    [/^badge-color-(\w+)$/, ([, color]) => `bg-${color}-400:20 dark:bg-${color}-400:10 text-${color}-700 dark:text-${color}-300 border-${color}-600:10 dark:border-${color}-300:10`],
    [/^bg-glass(:\d+)?$/, ([, opacity = ':75']) => `bg-white${opacity} dark:bg-#111${opacity} backdrop-blur-5`],
  ],
  theme: {
    colors: {
      primary: {
        50: '#E9F4E7',
        100: '#D2E8CF',
        200: '#A9D3A2',
        300: '#7CBC71',
        400: '#579E4B',
        DEFAULT: '#579E4B',
        500: '#49833E',
        600: '#396831',
        700: '#2C5026',
        800: '#1D3419',
        900: '#0F1C0D',
        950: '#080E07',
      },
    },
  },
  presets: [
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

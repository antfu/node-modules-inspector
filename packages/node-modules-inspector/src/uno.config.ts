import { fileURLToPath } from 'node:url'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: {
    'color-base': 'color-neutral-800 dark:color-neutral-300',
    'bg-base': 'bg-white dark:bg-#111',
    'bg-secondary': 'bg-#eee dark:bg-#222',
    'border-base': 'border-#8882',

    'bg-tooltip': 'bg-white:75 dark:bg-#111:75 backdrop-blur-8',
    'bg-glass': 'bg-white:75 dark:bg-#111:75 backdrop-blur-5',
    'bg-code': 'bg-gray5:5',
    'bg-hover': 'bg-primary-400:5',

    'color-active': 'color-primary-600 dark:color-primary-400',
    'border-active': 'border-primary-600/25 dark:border-primary-400/25',
    'bg-active': 'bg-#8881',

    'btn-action': 'border border-base rounded flex gap-2 items-center px2 py1 op75 hover:op100 hover:bg-hover',
    'btn-action-sm': 'btn-action text-sm',
    'btn-action-active': 'color-active border-active! bg-active op100!',

    'badge': 'border border-base rounded flex items-center px2',
    'badge-active': 'badge border-amber:50 text-amber bg-amber:5',
    'btn-badge': 'badge hover:bg-active',

    'icon-catppuccin': 'light:filter-invert-100 light:filter-hue-rotate-180 light:filter-brightness-80',

    'z-graph-bg': 'z-5',
    'z-graph-link': 'z-10',
    'z-graph-node': 'z-11',
    'z-graph-link-active': 'z-12',
    'z-graph-node-active': 'z-13',
  },
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
    presetUno(),
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

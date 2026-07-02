import { GLOBALS_UPDATED } from 'storybook/internal/core-events'
import { addons } from 'storybook/manager-api'
import { themes } from 'storybook/theming'

// Sync the Storybook manager (chrome) theme with the preview's `theme` global so
// the toolbar toggle flips both, instead of leaving the chrome mismatched.
addons.register('nmi/theme-sync', (api) => {
  const apply = (theme?: string): void => api.setOptions({ theme: theme === 'dark' ? themes.dark : themes.light })
  apply(api.getGlobals().theme)
  api.getChannel()?.on(GLOBALS_UPDATED, ({ globals }: { globals?: { theme?: string } }) => apply(globals?.theme))
})

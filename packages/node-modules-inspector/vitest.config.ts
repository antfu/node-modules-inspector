import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors Nuxt's built-in `#shared` alias (nuxt.config.ts `srcDir: 'app'`,
      // shared dir defaults to `<rootDir>/shared` i.e. `src/shared`), which
      // vitest doesn't pick up on its own.
      '#shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
})

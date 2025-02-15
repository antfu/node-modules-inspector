import { defineConfig } from './packages/node-modules-inspector/src/node/index'

export default defineConfig({
  defaultFilters: {
    excludes: [
      'eslint',
    ],
    modules: ['cjs'],
  },
})

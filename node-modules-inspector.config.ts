import { defineConfig } from './packages/node-modules-inspector/src/node/index'

export default defineConfig({
  name: 'node-modules-inspector',
  excludeDependenciesOf: [
    'eslint',
  ],
  excludePackages: [
    '@pnpm/list',
    '@pnpm/types',
  ],
  defaultFilters: {
    excludes: [
      'webpack',
    ],
  },
  publint: true,
})

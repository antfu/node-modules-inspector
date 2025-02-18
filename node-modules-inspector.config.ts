import { defineConfig } from './packages/node-modules-inspector/src/node/index'

export default defineConfig({
  name: 'node-modules-inspector',
  excludeDependenciesOf: [
    'eslint',
  ],
  excludePackages: [
    '@antfu/eslint-config',
  ],
  defaultFilters: {
    excludes: [
      'webpack',
    ],
  },
})
